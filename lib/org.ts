import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './prisma.js'

export async function requireOrgMember(
    req: VercelRequest,
    res: VercelResponse,
    userId: number,
    organizationId: number
) {
    const membership = await prisma.organizationMembership.findFirst({
        where: {
            userId: userId,
            organizationId: organizationId
        }
    })

    if (!membership) {
        res.status(403).json({ error: 'Forbidden' })
        return null
    }

    return membership
}

export function getOrgIdFromHeader(req: VercelRequest): number | null {
    const raw = req.headers['x-org-id']
    const value = Array.isArray(raw) ? raw[0] : raw
    const id = value ? Number(value) : NaN
    return Number.isFinite(id) ? id : null
}
