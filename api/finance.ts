import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgMember } from '../lib/org.js'
import { createTransaction } from '../lib/accounting.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res)
        if (!userId) return

        const organizationId = getOrgIdFromHeader(req)
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' })
        }

        const membership = await requireOrgMember(req, res, userId, organizationId)
        if (!membership) return

        const { action } = req.query
        const actionStr = Array.isArray(action) ? action[0] : (action || 'dashboard')

        switch (actionStr) {
            case 'dashboard':
                return await handleDashboard(req, res, organizationId)
            case 'accounts':
                return await handleAccounts(req, res, organizationId)
            case 'transactions':
                return await handleTransactions(req, res, organizationId) // Includes creation via POST
            case 'sie':
            case 'export-sie':
                return await handleSieExport(req, res, organizationId)
            default:
                return res.status(404).json({ error: 'Finance action not found' })
        }
    } catch (error) {
        console.error('Finance API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Previously in api/dashboard.ts
async function handleDashboard(req: VercelRequest, res: VercelResponse, organizationId: number) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get organization info
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true }
    })

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    // Get all accounts for this organization
    const accounts = await prisma.account.findMany({
        where: { organizationId },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    // Get all transactions for this organization
    const allTransactions = await prisma.transaction.findMany({
        where: {
            account: { organizationId }
        },
        include: { account: true },
        orderBy: { createdAt: 'desc' }
    })

    // Get club members count and payment status (Soft Deleted filtered)
    const allMembers = await prisma.member.findMany({
        where: {
            organizationId,
            deletedAt: null
        },
        select: { paid: true }
    })

    const membersCount = allMembers.length
    const paidMembersCount = allMembers.filter(m => m.paid).length
    const unpaidMembersCount = allMembers.filter(m => !m.paid).length

    // Calculate financial summary
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get transactions for current month
    const monthlyTransactions = allTransactions.filter(t =>
        new Date(t.createdAt) >= firstDayOfMonth
    )

    // Calculate total balance across all accounts
    const totalBalance = allTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Calculate monthly income (positive amounts)
    const monthlyIncome = monthlyTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)

    // Calculate monthly expenses (negative amounts)
    const monthlyExpenses = Math.abs(
        monthlyTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
    )

    // Group monthly income by category
    const incomeByCategory = monthlyTransactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => {
            const cat = t.category || 'Övrigt'
            acc[cat] = (acc[cat] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

    // Group monthly expenses by category
    const expensesByCategory = monthlyTransactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => {
            const cat = t.category || 'Övrigt'
            acc[cat] = (acc[cat] || 0) + Math.abs(t.amount)
            return acc
        }, {} as Record<string, number>)

    // Transform logic specific for frontend dashboard consumption
    const incomeBreakdown = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }))
    const expenseBreakdown = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))

    // Recent transactions (last 5)
    const recentTransactions = allTransactions.slice(0, 5).map(t => ({
        id: t.id,
        date: t.createdAt,
        description: t.description || 'Transaktion',
        amount: t.amount,
        type: t.amount >= 0 ? 'income' : 'expense',
        status: 'completed',
        voucher: `${t.voucherSeries}${t.voucherNumber}`
    }))

    return res.status(200).json({
        organization,
        financialSummary: {
            totalBalance,
            monthlyIncome,
            monthlyExpenses
        },
        members: {
            total: membersCount,
            paid: paidMembersCount,
            unpaid: unpaidMembersCount
        },
        incomeBreakdown,
        expenseBreakdown,
        recentTransactions,
        accounts
    })
}

// Previously in api/accounts.ts
async function handleAccounts(req: VercelRequest, res: VercelResponse, organizationId: number) {
    if (req.method === 'GET') {
        const accounts = await prisma.account.findMany({
            where: { organizationId },
            include: {
                transactions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        return res.status(200).json(accounts)
    }

    if (req.method === 'POST') {
        const { name } = req.body ?? {} // Safe destructure
        if (!name) {
            return res.status(400).json({ error: 'Name is required' })
        }

        const account = await prisma.account.create({
            data: {
                name: String(name),
                organizationId
            }
        })

        return res.status(201).json(account)
    }

    return res.status(405).json({ error: 'Method not allowed' })
}

// Previously in api/transactions.ts
async function handleTransactions(req: VercelRequest, res: VercelResponse, organizationId: number) {
    if (req.method === 'GET') {
        const transactions = await prisma.transaction.findMany({
            where: {
                account: { organizationId },
            },
            include: { account: true },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json(transactions);
    }

    if (req.method === 'POST') {
        const { amount, description, category, accountId } = req.body ?? {};

        const amountNumber = Number(amount);
        const accountIdNumber = Number(accountId);

        if (!Number.isFinite(amountNumber) || !Number.isFinite(accountIdNumber)) {
            return res.status(400).json({ error: "Amount and accountId are required" });
        }

        // Verify account belongs to organization
        const account = await prisma.account.findFirst({
            where: {
                id: accountIdNumber,
                organizationId
            }
        });

        if (!account) {
            return res.status(403).json({ error: "Account not found or access denied" });
        }

        try {
            const transaction = await createTransaction({
                organizationId,
                accountId: accountIdNumber,
                amount: amountNumber, // amount or amountNumber, need to check if amount is parsed. Yes it is `const amountNumber = Number(amount);`
                description,
                category
            });
            return res.status(201).json(transaction);
        } catch (error) {
            console.error("Transaction creation failed:", error);
            return res.status(500).json({ error: "Failed to create transaction" });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// Previously in api/accounting.ts (SIE Export)
async function handleSieExport(req: VercelRequest, res: VercelResponse, organizationId: number) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

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

    const filename = `sie_export_${org.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.se`

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(sieContent)
}

function generateSIE4(org: any, transactions: any[]): string {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD

    const accountMapping: Record<string, number> = {
        'Medlemsavgift': 3010,
        'Tävlingsavgift': 3050,
        'Träningsavgift': 3040,
        'Sponsring': 3900,
        'Lokalhyra': 5010,
        'Utrustning': 4010,
        'Övrigt': 6990,
    }

    const defaultIncomeAccount = 3990
    const defaultExpenseAccount = 6990
    const bankAccount = 1930

    let sie = ''
    const quote = (str: string) => `"${(str || '').replace(/"/g, '')}"`

    sie += `#FLAGGA 0\r\n`
    sie += `#PROGRAM "TechshipProto" 1.0\r\n`
    sie += `#FORMAT PC8\r\n`
    sie += `#GEN ${dateStr} "${quote(org.name)}"\r\n`
    sie += `#FNAM ${quote(org.name)}\r\n`

    const currentYear = now.getFullYear()
    sie += `#RAR 0 ${currentYear}0101 ${currentYear}1231\r\n`

    const usedAccounts = new Set<number>()
    usedAccounts.add(bankAccount)

    transactions.forEach(t => {
        let contraAccount
        if (t.category && accountMapping[t.category]) {
            contraAccount = accountMapping[t.category]
        } else {
            contraAccount = t.amount >= 0 ? defaultIncomeAccount : defaultExpenseAccount
        }
        usedAccounts.add(contraAccount)
    })

    usedAccounts.forEach(acc => {
        const name = acc === 1930 ? 'Bank' : 'Konto ' + acc
        sie += `#KONTO ${acc} ${quote(name)}\r\n`
    })

    sie += `\r\n`

    transactions.forEach(t => {
        const tDate = new Date(t.createdAt).toISOString().split('T')[0].replace(/-/g, '')
        const safeDesc = quote(t.description || 'Transaktion')

        sie += `#VER ${quote(t.voucherSeries)} ${t.voucherNumber} ${tDate} ${safeDesc} ${tDate}\r\n`

        const amount = t.amount.toFixed(2)
        sie += `#TRANS ${bankAccount} {} ${amount}\r\n`

        let contraAccount
        if (t.category && accountMapping[t.category]) {
            contraAccount = accountMapping[t.category]
        } else {
            contraAccount = t.amount >= 0 ? defaultIncomeAccount : defaultExpenseAccount
        }

        const contraAmount = (-t.amount).toFixed(2)
        sie += `#TRANS ${contraAccount} {} ${contraAmount}\r\n`

        sie += `}\r\n`
    })

    return sie
}
