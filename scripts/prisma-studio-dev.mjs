/**
 * Opens Prisma Studio against the development database (DEV_DATABASE_URL in .env).
 * Usage: node scripts/prisma-studio-dev.mjs
 */
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

if (!fs.existsSync(envPath)) {
  console.error('No .env file found at project root.')
  process.exit(1)
}

const raw = fs.readFileSync(envPath, 'utf8')
const line = raw.split(/\r?\n/).find((l) => l.startsWith('DEV_DATABASE_URL='))
if (!line) {
  console.error('DEV_DATABASE_URL is not set in .env. Add it for your development branch database.')
  process.exit(1)
}

let value = line.slice('DEV_DATABASE_URL='.length).trim()
if (
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
) {
  value = value.slice(1, -1)
}

process.env.DATABASE_URL = value

console.log('Starting Prisma Studio (development database from DEV_DATABASE_URL)…')

const child = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: value },
})

child.on('exit', (code) => process.exit(code ?? 0))
