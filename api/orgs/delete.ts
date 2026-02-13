import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'DELETE' && req.method !== 'POST') {
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
            },
            include: {
                organization: true
            }
        })

        if (!membership) {
            return res.status(403).json({ error: 'Only organization owners can delete organizations' })
        }

        // Delete the organization and all related data
        await prisma.$transaction(async (tx) => {
            // Delete all invites
            await tx.organizationInvite.deleteMany({
                where: { organizationId: Number(organizationId) }
            })

            // Delete all memberships
            await tx.organizationMembership.deleteMany({
                where: { organizationId: Number(organizationId) }
            })

            // Delete the organization
            await tx.organization.delete({
                where: { id: Number(organizationId) }
            })
        })

        return res.status(200).json({
            success: true,
            message: `Organization "${membership.organization.name}" deleted successfully`
        })
    } catch (error) {
        console.error('Delete organization error:', error)
        return res.status(500).json({ error: 'Failed to delete organization' })
    }
}
