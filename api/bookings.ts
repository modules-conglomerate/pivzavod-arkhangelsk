import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createBooking, listBookings } from './_lib/db'
import { authorize } from './_lib/guard'
import { bookingSchema } from '../src/lib/schemas'

// Бронирования самого пользователя. Кабинет персонала — в /api/staff/bookings.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const me = await authorize(req, res)
  if (!me) return
  if (req.method === 'GET') return res.json({ bookings: await listBookings(me.telegram_id) })
  if (req.method !== 'POST') return res.status(405).end()
  if (!me.registered_at) return res.status(403).json({ error: 'Сначала завершите регистрацию' })
  const parsed = bookingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const { comment, ...rest } = parsed.data
  res.status(201).json({ booking: await createBooking({ telegram_id: me.telegram_id, comment: comment || null, ...rest }) })
}
