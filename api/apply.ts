import type { VercelRequest, VercelResponse } from '@vercel/node'
import { insert, log, select, type ApplicationRow } from './_lib/db'
import { authorize } from './_lib/guard'
import { applicationSchema } from '../src/lib/schemas'

// Заявка сотрудника (сомелье / менеджер) на роль. Решение принимает администратор.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const me = await authorize(req, res)
  if (!me) return
  const mine = await select<ApplicationRow>('staff_applications', { telegram_id: me.telegram_id }, { order: 'created_at', desc: true })
  if (req.method === 'GET') return res.json({ applications: mine })
  if (req.method !== 'POST') return res.status(405).end()
  if (!me.registered_at) return res.status(403).json({ error: 'Сначала завершите регистрацию' })
  if (me.role !== 'customer') return res.status(409).json({ error: 'У вас уже есть рабочая роль' })
  if (mine.some((a) => a.status === 'pending')) return res.status(409).json({ error: 'Предыдущая заявка ещё на рассмотрении' })
  const parsed = applicationSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const d = parsed.data
  const application = await insert<ApplicationRow>('staff_applications', {
    telegram_id: me.telegram_id, desired_role: d.desiredRole, about: d.about, certificates: d.certificates || null,
    experience_years: d.experienceYears, status: 'pending', reviewed_by: null, review_note: null,
  })
  await log(me.telegram_id, 'application_created', application.id, { role: d.desiredRole })
  res.status(201).json({ application })
}
