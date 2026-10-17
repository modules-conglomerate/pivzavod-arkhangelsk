import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import {
  insert, log, remove, select, update,
  type ApplicationRow, type BeerRow, type BookingRow, type InviteRow, type SignupRow, type SlotRow, type UserRow,
} from '../_lib/db'
import { authorize } from '../_lib/guard'
import { can, rank } from '../../src/lib/roles'
import {
  attendanceSchema, beerNotesSchema, beerSchema, bookingPatchSchema, decisionSchema, inviteCreateSchema, slotCreateSchema, slotPatchSchema, userPatchSchema,
} from '../../src/lib/schemas'

type Req = VercelRequest
type Res = VercelResponse
const bad = (res: Res, msg: string, code = 400) => res.status(code).json({ error: msg })
const guestOf = (u?: UserRow) => u && { full_name: u.full_name ?? u.first_name, phone: u.phone, username: u.username }

// Один serverless-обработчик на весь кабинет персонала (лимит функций на тарифе Vercel Hobby — 12).
export default async function handler(req: Req, res: Res) {
  try {
    switch (String(req.query.resource)) {
      case 'bookings': return await bookings(req, res)
      case 'users': return await users(req, res)
      case 'applications': return await applications(req, res)
      case 'invites': return await invites(req, res)
      case 'beers': return await beers(req, res)
      case 'slots': return await slots(req, res)
      case 'attendance': return await attendance(req, res)
      default: return bad(res, 'Не найдено', 404)
    }
  } catch (e) {
    console.error(e)
    return bad(res, 'Ошибка сервера', 500)
  }
}

async function bookings(req: Req, res: Res) {
  const me = await authorize(req, res)
  if (!me) return
  const all = can(me.role, 'bookings:view_all')
  if (!all && !can(me.role, 'bookings:view_assigned')) return bad(res, 'Недостаточно прав', 403)

  if (req.method === 'GET') {
    let list = await select<BookingRow>('bookings', {}, { order: 'date' })
    // Сомелье видит заказы своего пива: свободные и назначенные на него.
    if (!all) list = list.filter((b) => b.assigned_to === me.telegram_id || (b.assigned_to === null && ['tour', 'custom-beer'].includes(b.kind)))
    const byId = new Map((await select<UserRow>('users')).map((u) => [u.telegram_id, u]))
    return res.json({ bookings: list.map((b) => ({ ...b, guest: guestOf(byId.get(b.telegram_id)) })) })
  }
  if (req.method !== 'PATCH') return res.status(405).end()
  const p = bookingPatchSchema.safeParse(req.body)
  if (!p.success) return bad(res, p.error.issues[0].message)
  const [cur] = await select<BookingRow>('bookings', { id: p.data.id })
  if (!cur) return bad(res, 'Заявка не найдена', 404)

  const patch: Record<string, unknown> = {}
  if (can(me.role, 'bookings:manage')) {
    if (p.data.status) patch.status = p.data.status
    if (p.data.assigned_to !== undefined) patch.assigned_to = p.data.assigned_to
  } else {
    const own = cur.assigned_to === me.telegram_id
    if (!own && cur.assigned_to !== null) return bad(res, 'Заявка закреплена за другим сотрудником', 403)
    if (p.data.assigned_to !== undefined) {
      if (p.data.assigned_to !== null && p.data.assigned_to !== me.telegram_id) return bad(res, 'Можно взять заявку только на себя', 403)
      if (p.data.assigned_to === null && !own) return bad(res, 'Нельзя снять чужую заявку', 403)
      patch.assigned_to = p.data.assigned_to
    }
    if (p.data.status) {
      if (!['confirmed', 'done'].includes(p.data.status) || (!own && patch.assigned_to !== me.telegram_id)) return bad(res, 'Недостаточно прав', 403)
      patch.status = p.data.status
    }
  }
  const [booking] = await update<BookingRow>('bookings', { id: cur.id }, patch)
  await log(me.telegram_id, 'booking_updated', cur.id, patch)
  return res.json({ booking })
}

async function users(req: Req, res: Res) {
  const me = await authorize(req, res, 'users:view')
  if (!me) return
  if (req.method === 'GET') return res.json({ users: await select<UserRow>('users', {}, { order: 'created_at', desc: true }) })
  if (req.method !== 'PATCH') return res.status(405).end()
  if (!can(me.role, 'users:manage')) return bad(res, 'Недостаточно прав', 403)
  const p = userPatchSchema.safeParse(req.body)
  if (!p.success) return bad(res, p.error.issues[0].message)
  if (p.data.telegram_id === me.telegram_id) return bad(res, 'Нельзя менять собственную роль или статус', 403)
  const { telegram_id, ...patch } = p.data
  const [user] = await update<UserRow>('users', { telegram_id }, patch)
  if (!user) return bad(res, 'Пользователь не найден', 404)
  await log(me.telegram_id, 'user_updated', String(telegram_id), patch)
  return res.json({ user })
}

async function applications(req: Req, res: Res) {
  const me = await authorize(req, res, 'applications:review')
  if (!me) return
  if (req.method === 'GET') {
    const byId = new Map((await select<UserRow>('users')).map((u) => [u.telegram_id, u]))
    const list = await select<ApplicationRow>('staff_applications', {}, { order: 'created_at', desc: true })
    return res.json({ applications: list.map((a) => ({ ...a, applicant: guestOf(byId.get(a.telegram_id)) })) })
  }
  if (req.method !== 'PATCH') return res.status(405).end()
  const p = decisionSchema.safeParse(req.body)
  if (!p.success) return bad(res, p.error.issues[0].message)
  const [app] = await select<ApplicationRow>('staff_applications', { id: p.data.id })
  if (!app) return bad(res, 'Заявка не найдена', 404)
  if (app.status !== 'pending') return bad(res, 'Решение уже принято', 409)
  const [updated] = await update<ApplicationRow>('staff_applications', { id: app.id }, {
    status: p.data.decision, reviewed_by: me.telegram_id, review_note: p.data.note || null,
  })
  if (p.data.decision === 'approved') {
    const [target] = await select<UserRow>('users', { telegram_id: app.telegram_id })
    if (target && rank(app.desired_role) > rank(target.role)) await update('users', { telegram_id: app.telegram_id }, { role: app.desired_role })
  }
  await log(me.telegram_id, `application_${p.data.decision}`, app.id)
  return res.json({ application: updated })
}

async function invites(req: Req, res: Res) {
  const me = await authorize(req, res, 'invites:manage')
  if (!me) return
  if (req.method === 'GET') return res.json({ invites: await select<InviteRow>('invites', {}, { order: 'created_at', desc: true }) })
  if (req.method === 'POST') {
    const p = inviteCreateSchema.safeParse(req.body)
    if (!p.success) return bad(res, p.error.issues[0].message)
    const invite = await insert<InviteRow>('invites', {
      code: randomBytes(12).toString('base64url'), role: p.data.role, created_by: me.telegram_id,
      expires_at: new Date(Date.now() + p.data.days * 86400_000).toISOString(), used_by: null, used_at: null,
    })
    await log(me.telegram_id, 'invite_created', invite.code, { role: invite.role })
    return res.status(201).json({ invite })
  }
  if (req.method === 'DELETE') { // отзыв: код просто истекает сейчас
    const code = String(req.query.code ?? '')
    await update('invites', { code }, { expires_at: new Date().toISOString() })
    await log(me.telegram_id, 'invite_revoked', code)
    return res.status(204).end()
  }
  return res.status(405).end()
}

async function beers(req: Req, res: Res) {
  const me = await authorize(req, res, 'beers:notes')
  if (!me) return
  const manage = can(me.role, 'beers:manage')
  if (req.method === 'GET') return res.json({ beers: await select<BeerRow>('beers', {}, { order: 'sort' }) })
  if (req.method === 'PATCH') {
    // Сомелье и менеджер правят только дегустационные заметки и сочетания; всё остальное — администратор.
    const p = manage ? beerSchema.partial().safeParse(req.body) : beerNotesSchema.extend({ id: beerSchema.shape.id }).safeParse(req.body)
    if (!p.success) return bad(res, p.error.issues[0].message)
    const { id, ...patch } = p.data as { id: string } & Record<string, unknown>
    const [beer] = await update<BeerRow>('beers', { id }, { ...patch, updated_by: me.telegram_id })
    if (!beer) return bad(res, 'Сорт не найден', 404)
    await log(me.telegram_id, 'beer_updated', id)
    return res.json({ beer })
  }
  if (!manage) return bad(res, 'Недостаточно прав', 403)
  if (req.method === 'POST') {
    const p = beerSchema.safeParse(req.body)
    if (!p.success) return bad(res, p.error.issues[0].message)
    if ((await select('beers', { id: p.data.id })).length) return bad(res, 'Сорт с таким id уже есть', 409)
    return res.status(201).json({ beer: await insert<BeerRow>('beers', { ...p.data, updated_by: me.telegram_id }) })
  }
  if (req.method === 'DELETE') { await remove('beers', { id: String(req.query.id ?? '') }); return res.status(204).end() }
  return res.status(405).end()
}

async function slots(req: Req, res: Res) {
  const me = await authorize(req, res, 'rakurs:view')
  if (!me) return
  const manage = can(me.role, 'rakurs:manage')
  if (req.method === 'GET') {
    const since = Date.now() - 30 * 86400_000
    let list = (await select<SlotRow>('rakurs_slots', {}, { order: 'starts_at' })).filter((s) => new Date(s.starts_at).getTime() >= since)
    if (!manage) list = list.filter((s) => s.sommelier_id === me.telegram_id)
    const signups = await select<SignupRow>('rakurs_signups')
    const byId = new Map((await select<UserRow>('users')).map((u) => [u.telegram_id, u]))
    return res.json({
      slots: list.map((s) => ({
        ...s,
        signups: signups.filter((x) => x.slot_id === s.id && x.status !== 'cancelled').map((x) => ({ ...x, guest: guestOf(byId.get(x.telegram_id)) })),
      })),
    })
  }
  if (!manage) return bad(res, 'Недостаточно прав', 403)
  if (req.method === 'POST') {
    const p = slotCreateSchema.safeParse(req.body)
    if (!p.success) return bad(res, p.error.issues[0].message)
    if (p.data.sommelierId !== null) {
      const [lead] = await select<UserRow>('users', { telegram_id: p.data.sommelierId })
      if (lead?.role !== 'sommelier') return bad(res, 'Ведущим можно назначить только сомелье')
    }
    const slot = await insert<SlotRow>('rakurs_slots', {
      title: p.data.title, starts_at: p.data.startsAt, capacity: p.data.capacity, price_rub: p.data.priceRub,
      sommelier_id: p.data.sommelierId, status: 'open', created_by: me.telegram_id,
    })
    await log(me.telegram_id, 'slot_created', slot.id)
    return res.status(201).json({ slot })
  }
  if (req.method === 'PATCH') {
    const p = slotPatchSchema.safeParse(req.body)
    if (!p.success) return bad(res, p.error.issues[0].message)
    const { id, ...patch } = p.data
    const [slot] = await update<SlotRow>('rakurs_slots', { id }, patch)
    if (!slot) return bad(res, 'Ракурс не найден', 404)
    if (patch.status === 'cancelled') await update('rakurs_signups', { slot_id: id, status: 'registered' }, { status: 'cancelled' })
    await log(me.telegram_id, 'slot_updated', id, patch)
    return res.json({ slot })
  }
  return res.status(405).end()
}

// Отметка «пришёл / не пришёл»: от неё зависят визиты, попробованные сорта и достижения гостя.
async function attendance(req: Req, res: Res) {
  const me = await authorize(req, res, 'rakurs:attend')
  if (!me) return
  if (req.method !== 'PATCH') return res.status(405).end()
  const p = attendanceSchema.safeParse(req.body)
  if (!p.success) return bad(res, p.error.issues[0].message)
  const [row] = await select<SignupRow>('rakurs_signups', { id: p.data.id })
  if (!row || row.status === 'cancelled') return bad(res, 'Запись не найдена', 404)
  const [slot] = await select<SlotRow>('rakurs_slots', { id: row.slot_id })
  if (!slot) return bad(res, 'Ракурс не найден', 404)
  if (!can(me.role, 'rakurs:manage') && slot.sommelier_id !== me.telegram_id) return bad(res, 'Это не ваш ракурс', 403)
  if (p.data.status !== 'registered' && new Date(slot.starts_at) > new Date()) return bad(res, 'Ракурс ещё не начался', 409)
  const [signup] = await update<SignupRow>('rakurs_signups', { id: row.id }, { status: p.data.status })
  await log(me.telegram_id, `attendance_${p.data.status}`, row.id)
  return res.json({ signup })
}
