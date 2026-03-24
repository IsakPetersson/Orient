import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma.js'
import { setSessionCookie, clearSessionCookie, requireAuth } from '../lib/session.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js'

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
            case 'verify':
                return await handleVerifyEmail(req, res)
            case 'resend-verify':
                return await handleResendVerify(req, res)
            case 'forgot':
                return await handleForgotPassword(req, res)
            case 'reset':
                return await handleResetPassword(req, res)
            case 'update-profile':
                return await handleUpdateProfile(req, res)
            case 'change-password':
                return await handleChangePassword(req, res)
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
        emailVerified: user.emailVerified,
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

    const { email, name, password, rememberMe, betaCode } = req.body ?? {}

    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate beta access code
    if (!betaCode) {
        return res.status(403).json({ error: 'A beta access code is required to register' })
    }

    const normalizedCode = String(betaCode).trim().toUpperCase()
    const codeRecord = await prisma.registrationCode.findUnique({
        where: { code: normalizedCode }
    })

    if (!codeRecord || codeRecord.usedAt) {
        return res.status(403).json({ error: 'Invalid or already used access code' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedName = String(name).trim()
    const passwordHash = await bcrypt.hash(String(password), 12)

    try {
        const emailVerifyToken = randomBytes(32).toString('hex')

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: normalizedName,
                password: passwordHash,
                emailVerifyToken
            },
            select: { id: true, email: true, name: true, createdAt: true, emailVerified: true }
        })

        // Mark code as used
        await prisma.registrationCode.update({
            where: { id: codeRecord.id },
            data: { usedAt: new Date(), usedByEmail: normalizedEmail }
        })

        // Confirm the token was actually persisted (defensive check)
        const stored = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerifyToken: true }
        })
        const tokenToSend = stored?.emailVerifyToken ?? emailVerifyToken
        if (!stored?.emailVerifyToken) {
            // Token wasn't stored — write it now
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerifyToken }
            })
        }

        // Send verification email
        try {
            await sendVerificationEmail(normalizedEmail, normalizedName, tokenToSend)
        } catch (err) {
            console.error('Failed to send verification email:', err)
        }

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
        select: { id: true, email: true, name: true, phone: true, avatarUrl: true, theme: true, emailVerified: true, createdAt: true }
    })

    return res.status(200).json(user)
}

async function handleUpdateProfile(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const userId = requireAuth(req, res)
    if (!userId) return

    const { name, phone, avatarUrl, theme } = req.body ?? {}

    if (name !== undefined && String(name).trim().length < 1) {
        return res.status(400).json({ error: 'Name cannot be empty' })
    }

    if (avatarUrl !== undefined && avatarUrl !== null && String(avatarUrl).length > 1_100_000) {
        return res.status(400).json({ error: 'Avatar image is too large. Please use a smaller image.' })
    }

    const validThemes = ['light', 'dark', 'midnight']
    if (theme !== undefined && !validThemes.includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme' })
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name !== undefined ? { name: String(name).trim() } : {}),
            ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
            ...(theme !== undefined ? { theme } : {})
        },
        select: { id: true, email: true, name: true, phone: true, avatarUrl: true, theme: true, emailVerified: true, createdAt: true }
    })

    return res.status(200).json(updated)
}

async function handleChangePassword(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const userId = requireAuth(req, res)
    if (!userId) return

    const { currentPassword, newPassword } = req.body ?? {}
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' })
    }
    if (String(newPassword).length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const ok = await bcrypt.compare(String(currentPassword), user.password)
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })

    const hash = await bcrypt.hash(String(newPassword), 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hash } })

    return res.status(200).json({ ok: true })
}

async function handleVerifyEmail(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { token } = req.body ?? {}
    if (!token) return res.status(400).json({ error: 'Missing token' })

    const tokenStr = String(token).trim()
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: tokenStr } })
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' })
    if (user.emailVerified) return res.status(200).json({ ok: true, alreadyVerified: true })

    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifyToken: null }
    })

    return res.status(200).json({ ok: true })
}

async function handleResendVerify(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const userId = requireAuth(req, res)
    if (!userId) return

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.emailVerified) return res.status(200).json({ ok: true, alreadyVerified: true })

    // Always generate a fresh token so old or missing tokens don't block verification
    const token = randomBytes(32).toString('hex')
    await prisma.user.update({ where: { id: userId }, data: { emailVerifyToken: token } })

    try {
        await sendVerificationEmail(user.email, user.name, token)
    } catch (err) {
        console.error('Failed to resend verification email:', err)
        return res.status(500).json({ error: 'Failed to send email. Please try again.' })
    }

    return res.status(200).json({ ok: true })
}

async function handleForgotPassword(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email } = req.body ?? {}
    if (!email) return res.status(400).json({ error: 'Missing email' })

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    // Always return success to avoid user enumeration
    if (!user) return res.status(200).json({ ok: true })

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt }
    })

    try {
        await sendPasswordResetEmail(normalizedEmail, user.name, token)
    } catch (err) {
        console.error('Failed to send password reset email:', err)
    }

    return res.status(200).json({ ok: true })
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { token, password } = req.body ?? {}
    if (!token || !password) return res.status(400).json({ error: 'Missing required fields' })
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token: String(token) },
        include: { user: true }
    })

    if (!resetRecord) return res.status(400).json({ error: 'Invalid or expired reset link' })
    if (resetRecord.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } })
        return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' })
    }

    const passwordHash = await bcrypt.hash(String(password), 12)

    await prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: passwordHash }
    })

    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } })

    return res.status(200).json({ ok: true })
}
