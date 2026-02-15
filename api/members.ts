import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgMember } from '../lib/org.js'

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

        // GET - Retrieve members
        if (req.method === 'GET') {
            // Check if user is owner
            const userMembership = await prisma.organizationMembership.findFirst({
                where: {
                    userId,
                    organizationId,
                    role: 'OWNER'
                }
            })

            if (!userMembership) {
                return res.status(403).json({ error: 'Only organization owners can view members' })
            }

            // Get all members of the organization
            const members = await prisma.member.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            })

            return res.status(200).json(members)
        }

        // POST - Create new member
        if (req.method === 'POST') {
            const { name, email, phone, type, fee, paid } = req.body ?? {}

            if (!name || !email || !type || fee === undefined) {
                return res.status(400).json({ error: 'Name, email, type, and fee are required' })
            }

            const member = await prisma.member.create({
                data: {
                    name: String(name),
                    email: String(email),
                    phone: phone ? String(phone) : null,
                    type: String(type),
                    fee: Number(fee),
                    paid: Boolean(paid),
                    organizationId
                }
            })

            return res.status(201).json(member)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Members API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
