import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === 'GET') {
            const accounts = await prisma.account.findMany({
                include: { transactions: true, organization: true },
            })
            return res.status(200).json(accounts)
        }

        if (req.method === 'POST') {
            const { name, organizationId } = req.body
            if (!name || !organizationId)
                return res.status(400).json({ error: 'Name and organizationId are required' })

            const account = await prisma.account.create({
                data: { name, organizationId },
            })
            return res.status(201).json(account)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
