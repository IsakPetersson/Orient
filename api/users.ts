import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const users = await prisma.user.findMany()
    return res.status(200).json(users)
  }

  if (req.method === 'POST') {
    const { email, name } = req.body

    const user = await prisma.user.create({
      data: { email, name }
    })

    return res.status(201).json(user)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
