import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const userId = requireAuth(req, res)
        if (!userId) return

        const { organizationId } = req.body ?? {}
        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' })
        }

        // Check if user is owner of the organization
        const membership = await prisma.organizationMembership.findFirst({
            where: {
                userId,
                organizationId: Number(organizationId),
                role: 'OWNER'
            }
        })

        if (!membership) {
            return res.status(403).json({ error: 'Only organization owners can get invite codes' })
        }

        // Get or create an active invite code
        let invite = await prisma.organizationInvite.findFirst({
            where: {
                organizationId: Number(organizationId),
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!invite) {
            // Create a new invite if none exists
            const crypto = await import('crypto')
            invite = await prisma.organizationInvite.create({
                data: {
                    organizationId: Number(organizationId),
                    code: crypto.randomBytes(6).toString('base64url')
                }
            })
        }

        return res.status(200).json({ code: invite.code })
    } catch (error) {
        console.error('Get invite code error:', error)
        return res.status(500).json({ error: 'Failed to get invite code' })
    }
}
