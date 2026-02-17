import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgMember } from '../lib/org.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const userId = requireAuth(req, res)
        if (!userId) return

        const organizationId = getOrgIdFromHeader(req)
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' })
        }

        const membership = await requireOrgMember(req, res, userId, organizationId)
        if (!membership) return

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

        // Get club members count and payment status
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

        // Convert to array format
        const incomeBreakdown = Object.entries(incomeByCategory).map(([category, amount]) => ({
            category,
            amount
        }))

        const expenseBreakdown = Object.entries(expensesByCategory).map(([category, amount]) => ({
            category,
            amount
        }))

        // Get recent transactions (last 10)
        const recentTransactions = allTransactions.slice(0, 10).map(t => ({
            id: t.id,
            type: t.amount >= 0 ? 'income' : 'expense',
            description: t.description || 'Ingen beskrivning',
            amount: Math.abs(t.amount),
            date: t.createdAt.toISOString().split('T')[0],
            category: t.category,
            accountName: t.account.name,
            voucherSeries: t.voucherSeries,
            voucherNumber: t.voucherNumber
        }))

        return res.status(200).json({
            organization: {
                id: organization.id,
                name: organization.name
            },
            financialSummary: {
                totalBalance,
                monthlyIncome,
                monthlyExpenses,
                monthlyResult: monthlyIncome - monthlyExpenses
            },
            accounts,
            recentTransactions,
            incomeBreakdown,
            expenseBreakdown,
            members: {
                total: membersCount,
                paid: paidMembersCount,
                unpaid: unpaidMembersCount
            }
        })
    } catch (error) {
        console.error('Dashboard error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
