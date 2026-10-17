import type { VercelRequest, VercelResponse } from '@vercel/node'
import { catalogIds, takenPlaces } from './_lib/catalog'
import { insert, log, select, update, type SignupRow, type SlotRow, type UserRow } from './_lib/db'
import { authorize } from './_lib/guard'
import { rakursSignupSchema } from '../src/lib/schemas'

type Req = VercelRequest
type Res = VercelResponse
const bad = (res: Res, msg: string, code = 400) => res.status(code).json({ error: msg })

// Публичное расписание ракурсов, запись гостя, отмена записи и «мои записи» для паспорта.
export default async function handler(req: Req, res: Res) {
  try {
    if (req.method === 'GET') return req.query.mine ? await mine(req, res) : await list(res)
    if (req.method === 'POST') return await signup(req, res)
    if (req.method === 'DELETE') return await cancel(req, res)
    return res.status(405).end()
  } catch (e) {
    console.error(e)
    return bad(res, 'Ошибка сервера', 500)
  }
}

async function list(res: Res) {
  const now = new Date()
  const slots = (await select<SlotRow>('rakurs_slots', { status: 'open' }, { order: 'starts_at' })).filter((s) => new Date(s.starts_at) > now)
  const signups = await select<SignupRow>('rakurs_signups')
  const people = new Map((await select<UserRow>('users')).map((u) => [u.telegram_id, u]))
  res.json({
    slots: slots.map((s) => {
      const taken = takenPlaces(signups, s.id)
      const lead = s.sommelier_id ? people.get(s.sommelier_id) : undefined
      return { id: s.id, title: s.title, starts_at: s.starts_at, capacity: s.capacity, price_rub: s.price_rub, status: s.status, taken, free: Math.max(0, s.capacity - taken), lead: lead ? (lead.full_name ?? lead.first_name) : null }
    }),
  })
}

async function mine(req: Req, res: Res) {
  const me = await authorize(req, res)
  if (!me) return
  const signups = await select<SignupRow>('rakurs_signups', { telegram_id: me.telegram_id }, { order: 'created_at', desc: true })
  const slots = new Map((await select<SlotRow>('rakurs_slots')).map((s) => [s.id, s]))
  res.json({
    signups: signups.flatMap((s) => {
      const slot = slots.get(s.slot_id)
      return slot ? [{ ...s, slot: { title: slot.title, starts_at: slot.starts_at, price_rub: slot.price_rub, status: slot.status } }] : []
    }),
  })
}

async function signup(req: Req, res: Res) {
  const me = await authorize(req, res)
  if (!me) return
  if (!me.registered_at) return bad(res, 'Сначала завершите регистрацию', 403)
  const p = rakursSignupSchema.safeParse(req.body)
  if (!p.success) return bad(res, p.error.issues[0].message)
  const d = p.data
  const [slot] = await select<SlotRow>('rakurs_slots', { id: d.slotId })
  if (!slot || slot.status !== 'open' || new Date(slot.starts_at) <= new Date()) return bad(res, 'Запись на этот ракурс закрыта', 409)
  const ids = await catalogIds()
  if (!d.setBeers.every((b) => ids.has(b))) return bad(res, 'Такого сорта нет в каталоге')
  const signups = await select<SignupRow>('rakurs_signups', { slot_id: slot.id })
  if (signups.some((s) => s.telegram_id === me.telegram_id && s.status !== 'cancelled')) return bad(res, 'Вы уже записаны на этот ракурс', 409)
  const free = slot.capacity - takenPlaces(signups, slot.id)
  if (d.guests > free) return bad(res, free > 0 ? `Осталось мест: ${free}` : 'Мест нет', 409)
  const row = await insert<SignupRow>('rakurs_signups', {
    slot_id: slot.id, telegram_id: me.telegram_id, guests: d.guests, set_beers: d.setBeers, focus_beer: d.focusBeer,
    comment: d.comment || null, status: 'registered',
  })
  await log(me.telegram_id, 'rakurs_signup', row.id, { slot: slot.id })
  res.status(201).json({ signup: row })
}

async function cancel(req: Req, res: Res) {
  const me = await authorize(req, res)
  if (!me) return
  const [row] = await select<SignupRow>('rakurs_signups', { id: String(req.query.id ?? ''), telegram_id: me.telegram_id })
  if (!row) return bad(res, 'Запись не найдена', 404)
  const [slot] = await select<SlotRow>('rakurs_slots', { id: row.slot_id })
  if (row.status !== 'registered' || !slot || new Date(slot.starts_at) <= new Date()) return bad(res, 'Эту запись уже нельзя отменить', 409)
  await update('rakurs_signups', { id: row.id }, { status: 'cancelled' })
  await log(me.telegram_id, 'rakurs_cancel', row.id)
  res.status(204).end()
}
