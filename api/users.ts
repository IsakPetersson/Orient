import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const users = await prisma.user.findMany()
      return res.status(200).json(users)
    }

    if (req.method === 'POST') {
      const { email, name, password } = req.body
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const user = await prisma.user.create({
        data: {
          email: email as string,
          name: name as string,
          password: password as string
        }
      })
      return res.status(201).json(user)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}