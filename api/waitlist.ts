import type { VercelRequest, VercelResponse } from '@vercel/node'
import { insert, select, type WaitlistRow } from './_lib/db'
import { normalizeContact, waitlistSchema } from '../src/lib/schemas'

// Подписка на новости об открытии. Публичная: ответ одинаков для новых и повторных контактов.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    if ((req.body as { website?: unknown } | null)?.website) return res.json({ ok: true }) // бот: молча делаем вид, что приняли
    const p = waitlistSchema.safeParse(req.body)
    if (!p.success) return res.status(400).json({ error: p.error.issues[0].message })
    const c = normalizeContact(p.data.contact)!
    if ((await select<WaitlistRow>('waitlist', { contact: c.value })).length === 0) await insert('waitlist', { contact: c.value, kind: c.kind })
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Не удалось сохранить, попробуйте позже' })
  }
}
