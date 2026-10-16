import type { VercelRequest, VercelResponse } from '@vercel/node'
import { saveProfile } from './_lib/db'
import { authorize } from './_lib/guard'
import { profileSchema } from '../src/lib/schemas'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const me = await authorize(req, res)
  if (!me) return
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const user = await saveProfile(me.telegram_id, {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone.replace(/[\s()-]/g, ''),
    marketing: parsed.data.marketing,
    registered_at: me.registered_at ?? new Date().toISOString(),
  })
  res.json({ user })
}
