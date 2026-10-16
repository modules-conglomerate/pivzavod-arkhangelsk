import type { VercelRequest, VercelResponse } from '@vercel/node'
import { log, update, upsertTelegramUser } from '../_lib/db'
import { issueSession } from '../_lib/session'
import { verifyTelegram } from '../_lib/telegram'

// Первые администраторы назначаются через ADMIN_TELEGRAM_IDS (список id через запятую).
const bootstrapAdmins = () => (process.env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN не задан' })
  const data: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.query)) data[k] = Array.isArray(v) ? v[0] : (v ?? '')
  if (!verifyTelegram(data, token)) return res.status(401).json({ error: 'Неверная подпись Telegram' })
  let user = await upsertTelegramUser({
    id: Number(data.id), first_name: data.first_name ?? '', last_name: data.last_name, username: data.username, photo_url: data.photo_url,
  })
  if (user.status === 'blocked') return res.redirect(302, '/login?blocked=1')
  if (user.role !== 'admin' && bootstrapAdmins().includes(user.telegram_id)) {
    user = (await update<typeof user>('users', { telegram_id: user.telegram_id }, { role: 'admin' }))[0]
    await log(user.telegram_id, 'bootstrap_admin', String(user.telegram_id))
  }
  issueSession(res, user.telegram_id)
  res.redirect(302, user.registered_at ? '/account' : '/register')
}
