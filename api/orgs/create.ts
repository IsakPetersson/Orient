import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../lib/session.js'
import crypto from 'crypto'

function makeInviteCode() {
    // Short, human-friendly-ish code
    return crypto.randomBytes(6).toString('base64url') // ~8 chars
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const userId = requireAuth(req, res)
        if (!userId) return

        const { name } = req.body ?? {}
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Organization name is required' })
        }

        const orgName = String(name).trim()

        const result = await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: orgName }
            })

            await tx.organizationMembership.create({
                data: {
                    userId,
                    organizationId: organization.id,
                    role: 'OWNER'
                }
            })

            // Create a one-time invite code (you can also generate on-demand later)
            const invite = await tx.organizationInvite.create({
                data: {
                    organizationId: organization.id,
                    code: makeInviteCode()
                    // optionally add expiresAt: new Date(Date.now()+7days)
                }
            })

            return { organization, invite }
        })

        return res.status(201).json({
            organization: result.organization,
            invite: {
                code: result.invite.code,
                expiresAt: result.invite.expiresAt
            }
        })
    } catch (error: any) {
        // In the rare case invite code collides with @@unique(code)
        if (error?.code === 'P2002') {
            return res.status(500).json({ error: 'Invite code collision, try again' })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
