import { createHmac, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const COOKIE = 'pz_session'
const TTL = 60 * 60 * 24 * 30

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET должен быть не короче 32 символов')
  return s
}
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')
const attrs = 'Path=/; HttpOnly; Secure; SameSite=Lax'

export function issueSession(res: VercelResponse, telegramId: number): void {
  const payload = Buffer.from(
    JSON.stringify({ id: telegramId, exp: Math.floor(Date.now() / 1000) + TTL }),
  ).toString('base64url')
  res.setHeader('Set-Cookie', `${COOKIE}=${payload}.${sign(payload)}; ${attrs}; Max-Age=${TTL}`)
}

export function clearSession(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${attrs}; Max-Age=0`)
}

export function readSession(req: VercelRequest): number | null {
  const part = req.headers.cookie?.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))
  if (!part) return null
  const [payload, sig] = part.slice(COOKIE.length + 1).split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const { id, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof id === 'number' && exp > Date.now() / 1000 ? id : null
  } catch {
    return null
  }
}
