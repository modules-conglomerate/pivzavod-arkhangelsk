import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { log, select, update, type InviteRow, type UserRow } from './_lib/db'
import { authorize } from './_lib/guard'
import { rank } from '../src/lib/roles'

// Активация приглашения: роль выдаётся только по одноразовому коду от администратора.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const me = await authorize(req, res)
  if (!me) return
  const parsed = z.object({ code: z.string().min(8).max(40) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Некорректный код приглашения' })
  const [invite] = await select<InviteRow>('invites', { code: parsed.data.code })
  if (!invite || invite.used_by !== null || new Date(invite.expires_at) < new Date())
    return res.status(410).json({ error: 'Приглашение недействительно или истекло' })
  if (rank(invite.role) <= rank(me.role)) return res.status(409).json({ error: 'У вас уже есть эта или более высокая роль' })
  const claimed = await update<InviteRow>('invites', { code: invite.code, used_by: null }, { used_by: me.telegram_id, used_at: new Date().toISOString() })
  if (claimed.length === 0) return res.status(410).json({ error: 'Приглашение уже использовано' })
  const [user] = await update<UserRow>('users', { telegram_id: me.telegram_id }, { role: invite.role })
  await log(me.telegram_id, 'invite_redeemed', invite.code, { role: invite.role })
  res.json({ user })
}
