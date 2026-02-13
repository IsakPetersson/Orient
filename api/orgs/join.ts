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

        const { code } = req.body ?? {}
        const inviteCode = String(code ?? '').trim()

        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code is required' })
        }

        const result = await prisma.$transaction(async (tx) => {
            const invite = await tx.organizationInvite.findUnique({
                where: { code: inviteCode }
            })

            if (!invite) {
                return { ok: false as const, reason: 'Invalid invite code' }
            }

            if (invite.usedAt) {
                return { ok: false as const, reason: 'Invite code already used' }
            }

            if (invite.expiresAt && invite.expiresAt < new Date()) {
                return { ok: false as const, reason: 'Invite code expired' }
            }

            // Create membership (unique on userId+organizationId prevents duplicates)
            const membership = await tx.organizationMembership.create({
                data: {
                    userId,
                    organizationId: invite.organizationId,
                    role: 'MEMBER'
                }
            })

            // Mark invite as used (one-time)
            await tx.organizationInvite.update({
                where: { id: invite.id },
                data: { usedAt: new Date() }
            })

            const organization = await tx.organization.findUnique({
                where: { id: invite.organizationId }
            })

            return { ok: true as const, membership, organization }
        })

        if (!result.ok) {
            return res.status(400).json({ error: result.reason })
        }

        return res.status(200).json({
            organization: result.organization,
            role: result.membership.role
        })
    } catch (error: any) {
        // user already member (unique constraint)
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'Already a member of this organization' })
        }

        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
