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
            // Get organization team members
            const teamMembers = await prisma.organizationMembership.findMany({
                where: { organizationId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get club members
            const clubMembers = await prisma.member.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            })

            return res.status(200).json({ teamMembers, clubMembers })
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

        // PATCH - Update club member (owner/admin only)
        if (req.method === 'PATCH') {
            // Verify the requester is an owner or admin
            const requesterMembership = await prisma.organizationMembership.findFirst({
                where: {
                    userId,
                    organizationId,
                    role: {
                        in: ['OWNER', 'ADMIN']
                    }
                }
            })

            if (!requesterMembership) {
                return res.status(403).json({ error: 'Only organization owners and admins can update members' })
            }

            const memberId = req.query.id ? Number(req.query.id) : null

            if (!memberId) {
                return res.status(400).json({ error: 'Member ID is required' })
            }

            const { paid } = req.body ?? {}

            if (paid === undefined) {
                return res.status(400).json({ error: 'Payment status is required' })
            }

            // Verify the member exists and belongs to this organization
            const member = await prisma.member.findFirst({
                where: {
                    id: memberId,
                    organizationId
                }
            })

            if (!member) {
                return res.status(404).json({ error: 'Member not found' })
            }

            // Update the member
            const updatedMember = await prisma.member.update({
                where: { id: memberId },
                data: { paid: Boolean(paid) }
            })

            return res.status(200).json({
                success: true,
                member: updatedMember
            })
        }

        // DELETE - Remove club member (owner only)
        if (req.method === 'DELETE') {
            // Verify the requester is an owner
            const requesterMembership = await prisma.organizationMembership.findFirst({
                where: {
                    userId,
                    organizationId,
                    role: 'OWNER'
                }
            })

            if (!requesterMembership) {
                return res.status(403).json({ error: 'Only organization owners can remove members' })
            }

            const memberId = req.query.id ? Number(req.query.id) : null

            if (!memberId) {
                return res.status(400).json({ error: 'Member ID is required' })
            }

            // Verify the member exists and belongs to this organization
            const member = await prisma.member.findFirst({
                where: {
                    id: memberId,
                    organizationId
                }
            })

            if (!member) {
                return res.status(404).json({ error: 'Member not found' })
            }

            // Delete the member
            await prisma.member.delete({
                where: { id: memberId }
            })

            return res.status(200).json({
                success: true,
                message: 'Member removed successfully'
            })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Members API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
