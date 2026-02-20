import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import crypto from 'crypto'

function checkSecret(req: VercelRequest, res: VercelResponse): boolean {
    const secret = process.env.ADMIN_SECRET
    if (!secret) {
        res.status(500).json({ error: 'ADMIN_SECRET not configured' })
        return false
    }
    const provided = req.headers['x-admin-secret']
    if (provided !== secret) {
        res.status(401).json({ error: 'Unauthorized' })
        return false
    }
    return true
}

function generateCode(): string {
    // Format: XXXX-XXXX-XXXX (uppercase alphanumeric, no ambiguous chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const segment = () =>
        Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join('')
    return `${segment()}-${segment()}-${segment()}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { action } = req.query
        const actionStr = Array.isArray(action) ? action[0] : action

        switch (actionStr) {
            case 'codes':
                return await listCodes(req, res)
            case 'generate':
                return await generateCodes(req, res)
            case 'delete':
                return await deleteCode(req, res)
            default:
                return res.status(404).json({ error: 'Not found' })
        }
    } catch (error) {
        console.error('Admin API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function listCodes(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    if (!checkSecret(req, res)) return

    const codes = await prisma.registrationCode.findMany({
        orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json(codes)
}

async function generateCodes(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!checkSecret(req, res)) return

    const { count = 1, note } = req.body ?? {}
    const n = Math.min(Math.max(parseInt(String(count), 10) || 1, 1), 50)

    const created = []
    for (let i = 0; i < n; i++) {
        let code: string
        let tries = 0
        do {
            code = generateCode()
            tries++
        } while (tries < 10 && await prisma.registrationCode.findUnique({ where: { code } }))

        const record = await prisma.registrationCode.create({
            data: { code, note: note ? String(note) : null }
        })
        created.push(record)
    }

    return res.status(201).json(created)
}

async function deleteCode(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
    if (!checkSecret(req, res)) return

    const id = parseInt(String(req.query.id), 10)
    if (!id) return res.status(400).json({ error: 'Missing id' })

    await prisma.registrationCode.delete({ where: { id } })
    return res.status(200).json({ ok: true })
}
