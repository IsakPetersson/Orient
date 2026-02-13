import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === 'GET') {
            const organizations = await prisma.organization.findMany({
                include: { users: true, accounts: true },
            })
            return res.status(200).json(organizations)
        }

        if (req.method === 'POST') {
            const { name } = req.body
            if (!name) return res.status(400).json({ error: 'Name is required' })

            const org = await prisma.organization.create({ data: { name } })
            return res.status(201).json(org)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
