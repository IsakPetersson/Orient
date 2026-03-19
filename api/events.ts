import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgAdmin, requireOrgMember } from '../lib/org.js'

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

        const action = req.query.action as string

        if (req.method === 'GET' || action === 'list') {
            return handleList(req, res, organizationId)
        }

        if (req.method === 'POST' && action === 'create') {
            const adminMembership = await requireOrgAdmin(req, res, userId, organizationId)
            if (!adminMembership) return
            return handleCreate(req, res, organizationId)
        }

        if (req.method === 'POST' && action === 'delete') {
            const adminMembership = await requireOrgAdmin(req, res, userId, organizationId)
            if (!adminMembership) return
            return handleDelete(req, res, organizationId)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return res.status(500).json({ error: 'Internal server error', detail: message })
    }
}

async function handleList(req: VercelRequest, res: VercelResponse, organizationId: number) {
    const { year, month } = req.query
    let where: { organizationId: number; date?: { gte: Date; lte: Date } } = { organizationId }

    if (year && month) {
        const y = parseInt(year as string)
        const m = parseInt(month as string) - 1
        const start = new Date(y, m, 1)
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
        where.date = { gte: start, lte: end }
    }

    const events = await prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
    })

    return res.status(200).json({ events })
}

async function handleCreate(req: VercelRequest, res: VercelResponse, organizationId: number) {
    const { title, date, endDate, description, type } = req.body

    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required' })
    }

    const event = await prisma.event.create({
        data: {
            organizationId,
            title: String(title).trim(),
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : null,
            description: description ? String(description).trim() : null,
            type: type || 'event',
        },
    })

    return res.status(201).json({ event })
}

async function handleDelete(req: VercelRequest, res: VercelResponse, organizationId: number) {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ error: 'Event ID is required' })
    }

    const event = await prisma.event.findFirst({
        where: { id: Number(id), organizationId },
    })

    if (!event) {
        return res.status(404).json({ error: 'Event not found' })
    }

    await prisma.event.delete({ where: { id: Number(id) } })

    return res.status(200).json({ success: true })
}
