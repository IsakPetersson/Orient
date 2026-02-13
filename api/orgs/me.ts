import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const userId = requireAuth(req, res)
        if (!userId) return

        const memberships = await prisma.organizationMembership.findMany({
            where: { userId },
            include: {
                organization: true
            },
            orderBy: { createdAt: 'asc' }
        })

        const orgs = memberships.map(m => ({
            organizationId: m.organizationId,
            role: m.role,
            organization: {
                id: m.organization.id,
                name: m.organization.name,
                createdAt: m.organization.createdAt
            }
        }))

        return res.status(200).json(orgs)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
