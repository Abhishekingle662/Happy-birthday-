import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const app = new Hono()
const PORT = Number(process.env.PORT) || 3001
const UPLOAD_DIR = join(import.meta.dir, 'uploads')
const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || `http://localhost:${PORT}`

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

app.use('*', cors({
  origin: process.env.FRONTEND_URL || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

app.get('/health', (c) => c.json({ ok: true }))

app.post('/api/music', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file === 'string') {
    return c.json({ error: 'No file provided' }, 400)
  }

  const blob = file as File
  if (!blob.type.startsWith('audio/')) {
    return c.json({ error: 'File must be an audio file' }, 400)
  }

  if (blob.size > 20 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 20 MB)' }, 413)
  }

  const ext = blob.name.split('.').pop() || 'mp3'
  const filename = `${randomUUID()}.${ext}`
  const filepath = join(UPLOAD_DIR, filename)

  const buffer = await blob.arrayBuffer()
  await Bun.write(filepath, buffer)

  return c.json({ url: `${BASE_URL}/uploads/${filename}` })
})

app.use('/uploads/*', serveStatic({ root: import.meta.dir }))

console.log(`Backend running on port ${PORT}`)
export default { port: PORT, fetch: app.fetch }
