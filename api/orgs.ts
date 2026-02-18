import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import crypto from 'crypto'

function makeInviteCode() {
    return crypto.randomBytes(6).toString('base64url')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res)
        if (!userId) return

        const { action } = req.query
        const actionStr = Array.isArray(action) ? action[0] : action

        switch (actionStr) {
            case 'me':
                return await handleGetMyOrgs(userId, req, res)
            case 'create':
                return await handleCreate(userId, req, res)
            case 'join':
                return await handleJoin(userId, req, res)
            case 'invite':
                return await handleInvite(userId, req, res)
            case 'delete':
                return await handleDelete(userId, req, res)
            case 'updateRole':
                return await handleUpdateRole(userId, req, res)
            case 'removeMember':
                return await handleRemoveMember(userId, req, res)
            case 'getDetails':
                return await handleGetDetails(userId, req, res)
            case 'update':
            case 'updateSettings':
                return await handleUpdateSettings(userId, req, res)
            default:
                return res.status(404).json({ error: 'Not found' })
        }
    } catch (error) {
        console.error('Org API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function handleGetMyOrgs(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const memberships = await prisma.organizationMembership.findMany({
        where: {
            userId,
            deletedAt: null,
            organization: {
                deletedAt: null
            }
        },
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
}

async function handleCreate(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

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

        const invite = await tx.organizationInvite.create({
            data: {
                organizationId: organization.id,
                code: makeInviteCode()
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
}

async function handleJoin(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { code } = req.body ?? {}
    const inviteCode = String(code ?? '').trim()

    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' })
    }

    const result = await prisma.$transaction(async (tx) => {
        const invite = await tx.organizationInvite.findUnique({
            where: { code: inviteCode },
            include: { organization: true }
        })

        if (!invite) {
            return { ok: false as const, reason: 'Invalid invite code' }
        }

        if (invite.organization.deletedAt) {
            return { ok: false as const, reason: 'Organization no longer exists' }
        }

        if (invite.usedAt) {
            return { ok: false as const, reason: 'Invite code already used' }
        }

        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return { ok: false as const, reason: 'Invite code expired' }
        }

        const membership = await tx.organizationMembership.create({
            data: {
                userId,
                organizationId: invite.organizationId,
                role: 'MEMBER'
            }
        })

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
}

async function handleInvite(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { organizationId } = req.body ?? {}
    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' })
    }

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

    let invite = await prisma.organizationInvite.findFirst({
        where: {
            organizationId: Number(organizationId),
            usedAt: null,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        },
        orderBy: { createdAt: 'desc' }
    })

    if (!invite) {
        invite = await prisma.organizationInvite.create({
            data: {
                organizationId: Number(organizationId),
                code: makeInviteCode()
            }
        })
    }

    return res.status(200).json({ code: invite.code })
}

async function handleDelete(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { organizationId } = req.body ?? {}
    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' })
    }

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

    await prisma.organization.update({
        where: { id: Number(organizationId) },
        data: { deletedAt: new Date() }
    })

    return res.status(200).json({
        success: true,
        message: `Organization "${membership.organization.name}" deleted successfully`
    })
}

async function handleUpdateRole(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const orgId = req.headers['x-org-id']
    const organizationId = orgId ? Number(orgId) : null

    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' })
    }

    const { membershipId, role } = req.body ?? {}

    if (!membershipId || !role) {
        return res.status(400).json({ error: 'Membership ID and role are required' })
    }

    // Verify the requester is an owner
    const requesterMembership = await prisma.organizationMembership.findFirst({
        where: {
            userId,
            organizationId,
            role: 'OWNER'
        }
    })

    if (!requesterMembership) {
        return res.status(403).json({ error: 'Only organization owners can update roles' })
    }

    // Verify the target membership exists and is in the same org
    const targetMembership = await prisma.organizationMembership.findFirst({
        where: {
            id: Number(membershipId),
            organizationId
        }
    })

    if (!targetMembership) {
        return res.status(404).json({ error: 'Membership not found' })
    }

    // Prevent changing owner's role
    if (targetMembership.role === 'OWNER') {
        return res.status(403).json({ error: 'Cannot change owner role' })
    }

    // Validate the new role
    const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
    }

    // Update the role
    const updated = await prisma.organizationMembership.update({
        where: { id: Number(membershipId) },
        data: { role },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                }
            }
        }
    })

    return res.status(200).json({
        success: true,
        membership: {
            id: updated.id,
            role: updated.role,
            joinedAt: updated.createdAt,
            user: updated.user
        }
    })
}

async function handleRemoveMember(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const orgId = req.headers['x-org-id']
    const organizationId = orgId ? Number(orgId) : null

    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' })
    }

    const { membershipId } = req.body ?? {}

    if (!membershipId) {
        return res.status(400).json({ error: 'Membership ID is required' })
    }

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

    // Verify the target membership exists and is in the same org
    const targetMembership = await prisma.organizationMembership.findFirst({
        where: {
            id: Number(membershipId),
            organizationId
        }
    })

    if (!targetMembership) {
        return res.status(404).json({ error: 'Membership not found' })
    }

    // Prevent removing owner
    if (targetMembership.role === 'OWNER') {
        return res.status(403).json({ error: 'Cannot remove organization owner' })
    }

    // Remove the membership
    await prisma.organizationMembership.update({
        where: { id: Number(membershipId) },
        data: { deletedAt: new Date() }
    })


    return res.status(200).json({
        success: true,
        message: 'Member removed successfully'
    })
}

async function handleGetDetails(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { organizationId } = req.body ?? {}
    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' })
    }

    // Verify the user is a member
    const membership = await prisma.organizationMembership.findFirst({
        where: {
            userId,
            organizationId: Number(organizationId),
            deletedAt: null,
            organization: { deletedAt: null }
        }
    })


    if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const organization = await prisma.organization.findUnique({
        where: { id: Number(organizationId) },
        select: {
            id: true,
            name: true,
            swishMerchantNumber: true,
            createdAt: true
        }
    })

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    return res.status(200).json({ organization })
}

async function handleUpdateSettings(userId: number, req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'PATCH' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const orgId = req.headers['x-org-id']
    const organizationId = orgId ? Number(orgId) : null

    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' })
    }

    // Verify the requester is an owner or admin
    const membership = await prisma.organizationMembership.findFirst({
        where: {
            userId,
            organizationId,
            deletedAt: null,
            organization: { deletedAt: null },
            role: {
                in: ['OWNER', 'ADMIN']
            }
        }
    })


    if (!membership) {
        return res.status(403).json({ error: 'Only organization owners and admins can update settings' })
    }

    const { swishMerchantNumber, orgNumber, logoUrl } = req.body ?? {}

    const dataToUpdate: any = {}

    if (swishMerchantNumber !== undefined) {
        dataToUpdate.swishMerchantNumber = swishMerchantNumber || null
    }

    if (orgNumber !== undefined) {
        dataToUpdate.orgNumber = orgNumber || null
    }

    if (logoUrl !== undefined) {
        dataToUpdate.logoUrl = logoUrl || null
    }

    // Update the organization
    const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            swishMerchantNumber: true,
            orgNumber: true,
            logoUrl: true,
            createdAt: true
        }
    })

    return res.status(200).json({
        success: true,
        organization: updated
    })
}
