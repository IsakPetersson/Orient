import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { requireAdminApiKey } from "../lib/auth.js";


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true }
      })
      return res.status(200).json(users)
    }

    if (req.method === 'POST') {
      const { email, name, password } = req.body

      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const normalizedEmail = String(email).trim().toLowerCase()
      const normalizedName = String(name).trim()

      const passwordHash = await bcrypt.hash(String(password), 12)

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedName,
          password: passwordHash
        },
        select: { id: true, email: true, name: true, createdAt: true }
      })

      return res.status(201).json(user)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    // Optional: nicer error for duplicate emails
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' })
    }

    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
