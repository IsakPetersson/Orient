import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgMember } from '../lib/org.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { action } = req.query

    if (action === 'export-sie' || action === 'sie') {
        return await handleSieExport(req, res)
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=export-sie' })
}

async function handleSieExport(req: VercelRequest, res: VercelResponse) {
    try {
        // Authenticate
        const userId = requireAuth(req, res)
        if (!userId) return

        const organizationId = getOrgIdFromHeader(req)
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' })
        }

        const membership = await requireOrgMember(req, res, userId, organizationId)
        if (!membership) return

        // Fetch organization details
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!org) {
            return res.status(404).json({ error: 'Organization not found' })
        }

        // Fetch all transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                account: {
                    organizationId
                }
            },
            include: {
                account: true
            },
            orderBy: [
                { voucherSeries: 'asc' },
                { voucherNumber: 'asc' }
            ]
        })

        // Generate SIE4 content
        const sieContent = generateSIE4(org, transactions)

        // Set response headers for file download
        const filename = `sie_export_${org.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.se`

        // SIE files are traditionally CP437 (IBM PC), but modern software often accepts CP1252 (Windows-1252)
        // Since node buffers are UTF-8 by default, we will send UTF-8 but declare format.
        // However, standard says default is CP437.
        // For compatibility, we will use a best-effort approach to sanitizing characters to basic ASCII/CP437 range 
        // or just use UTF-8 and rely on modern import tools (like Fortnox) handling it.
        // The #TOKEN 1930 part is the key.

        res.setHeader('Content-Type', 'text/plain; charset=utf-8') // Using UTF-8 for simplicity here
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(sieContent)
    } catch (error) {
        console.error('SIE Export error:', error)
        res.status(500).json({ error: 'Internal server error during SIE export' })
    }
}

/**
 * Generate SIE4 file content
 */
function generateSIE4(org: any, transactions: any[]): string {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD

    // Map categories to simple accounts (BAS-planen approximations)
    // In a real system, these would be user-configurable.
    const accountMapping: Record<string, number> = {
        'Medlemsavgift': 3010, // Medlemsavgifter
        'Tävlingsavgift': 3050, // Tävlingsintäkter
        'Träningsavgift': 3040, // Träningsavgifter
        'Sponsring': 3900, // Övriga rörelseintäkter (Sponsring)
        'Lokalhyra': 5010, // Lokalhyra
        'Utrustning': 4010, // Inköp material och varor
        'Övrigt': 6990, // Övriga kostnader / intäkter
    }

    const defaultIncomeAccount = 3990 // Övriga ersättningar och intäkter
    const defaultExpenseAccount = 6990 // Övriga externa kostnader
    const bankAccount = 1930 // Företagskonto / Checkräkning

    let sie = ''

    // Function to escape strings for SIE (quote marks)
    const quote = (str: string) => `"${(str || '').replace(/"/g, '')}"`

    // Header
    sie += `#FLAGGA 0\r\n`
    sie += `#PROGRAM "TechshipProto" 1.0\r\n`
    sie += `#FORMAT PC8\r\n` // Declaring PC8 (CP437), though we stream UTF-8. Many importers auto-detect.
    sie += `#GEN ${dateStr} "${quote(org.name)}"\r\n`
    sie += `#FNAM ${quote(org.name)}\r\n`

    // Fiscal Year (Simulated as current year for MVP)
    const currentYear = now.getFullYear()
    sie += `#RAR 0 ${currentYear}0101 ${currentYear}1231\r\n`

    // Accounts used (Header)
    const usedAccounts = new Set<number>()
    usedAccounts.add(bankAccount)

    // Pre-scan to find used accounts
    transactions.forEach(t => {
        let contraAccount
        if (t.category && accountMapping[t.category]) {
            contraAccount = accountMapping[t.category]
        } else {
            contraAccount = t.amount >= 0 ? defaultIncomeAccount : defaultExpenseAccount
        }
        usedAccounts.add(contraAccount)
    })

    // Output Account Definitions (#KONTO)
    // We just give them generic names for now since we don't have a chart of accounts in DB
    usedAccounts.forEach(acc => {
        const name = acc === 1930 ? 'Bank' : 'Konto ' + acc
        sie += `#KONTO ${acc} ${quote(name)}\r\n`
    })

    sie += `\r\n`

    // Transactions (#VER)
    transactions.forEach(t => {
        const tDate = new Date(t.createdAt).toISOString().split('T')[0].replace(/-/g, '')
        const safeDesc = quote(t.description || 'Transaktion')

        // Header: #VER <Series> <Number> <Date> <Text> <RegDate>
        sie += `#VER ${quote(t.voucherSeries)} ${t.voucherNumber} ${tDate} ${safeDesc} ${tDate}\r\n`

        // Row 1: Bank Transaction
        // #TRANS <Account> {ObjList} <Amount>
        // Note: Amount syntax is plain number. Decimals with dot.
        const amount = t.amount.toFixed(2)
        sie += `#TRANS ${bankAccount} {} ${amount}\r\n`

        // Row 2: Contra Entry (Balancing the books)
        // If bank is Debit (+100), Contra must be Credit (-100)
        let contraAccount
        if (t.category && accountMapping[t.category]) {
            contraAccount = accountMapping[t.category]
        } else {
            contraAccount = t.amount >= 0 ? defaultIncomeAccount : defaultExpenseAccount
        }

        // Contra amount is negative of transaction amount to balance to zero
        const contraAmount = (-t.amount).toFixed(2)
        sie += `#TRANS ${contraAccount} {} ${contraAmount}\r\n`

        sie += `}\r\n` // End of verification block
    })

    return sie
}
