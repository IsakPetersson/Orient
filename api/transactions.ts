import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === 'GET') {
            const transactions = await prisma.transaction.findMany({
                include: { account: true },
                orderBy: { createdAt: 'desc' },
            })
            return res.status(200).json(transactions)
        }

        if (req.method === 'POST') {
            const { amount, description, category, accountId } = req.body
            if (!amount || !accountId)
                return res.status(400).json({ error: 'Amount and accountId are required' })

            const transaction = await prisma.transaction.create({
                data: { amount, description, category, accountId },
            })
            return res.status(201).json(transaction)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
