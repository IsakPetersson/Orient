import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { setSessionCookie, clearSessionCookie, requireAuth } from '../lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { action } = req.query
        const actionStr = Array.isArray(action) ? action[0] : action

        switch (actionStr) {
            case 'login':
                return await handleLogin(req, res)
            case 'logout':
                return await handleLogout(req, res)
            case 'register':
                return await handleRegister(req, res)
            case 'me':
                return await handleMe(req, res)
            default:
                return res.status(404).json({ error: 'Not found' })
        }
    } catch (error) {
        console.error('Auth API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password, rememberMe } = req.body ?? {}

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    })

    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    setSessionCookie(res, user.id, { rememberMe })

    return res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
    })
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    clearSessionCookie(res)
    return res.status(200).json({ ok: true })
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, name, password, rememberMe } = req.body ?? {}

    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedName = String(name).trim()
    const passwordHash = await bcrypt.hash(String(password), 12)

    try {
        const user = await prisma.user.create({
            data: { email: normalizedEmail, name: normalizedName, password: passwordHash },
            select: { id: true, email: true, name: true, createdAt: true }
        })

        setSessionCookie(res, user.id, { rememberMe })

        return res.status(201).json(user)
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' })
        }
        throw error
    }
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const userId = requireAuth(req, res)
    if (!userId) return

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true }
    })

    return res.status(200).json(user)
}
