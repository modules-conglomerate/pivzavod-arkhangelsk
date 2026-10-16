import type { Role } from '../../src/lib/roles'

export type Row = Record<string, unknown>
type Where = Record<string, string | number | boolean | null>

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const live = Boolean(URL && KEY)
// Без Supabase — in-memory хранилище (только для проверки; на Vercel не переживает перезапуск).
const mem: Record<string, Row[]> = {}
const tbl = (n: string) => (mem[n] ??= [])
const match = (r: Row, w: Where) => Object.entries(w).every(([k, v]) => (r[k] ?? null) === v)
const filters = (w: Where) =>
  Object.entries(w).map(([k, v]) => `${k}=${v === null ? 'is.null' : `eq.${encodeURIComponent(String(v))}`}`)

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`)
  return (await r.json()) as T
}

export async function select<T>(table: string, where: Where = {}, o: { order?: string; desc?: boolean; limit?: number } = {}): Promise<T[]> {
  if (!live) {
    let rows = tbl(table).filter((r) => match(r, where))
    if (o.order) {
      const k = o.order
      rows = [...rows].sort((a, b) => (String(a[k] ?? '') < String(b[k] ?? '') ? -1 : 1))
      if (o.desc) rows.reverse()
    }
    return (o.limit ? rows.slice(0, o.limit) : rows) as T[]
  }
  const q = [...filters(where), 'select=*']
  if (o.order) q.push(`order=${o.order}.${o.desc ? 'desc' : 'asc'}`)
  if (o.limit) q.push(`limit=${o.limit}`)
  return rest<T[]>(`${table}?${q.join('&')}`)
}

export async function insert<T>(table: string, row: Row): Promise<T> {
  if (!live) {
    const withId = ['bookings', 'staff_applications', 'audit_log'].includes(table) ? { id: crypto.randomUUID() } : {}
    const r = { ...withId, created_at: new Date().toISOString(), ...row }
    tbl(table).push(r)
    return r as T
  }
  return (await rest<T[]>(table, { method: 'POST', body: JSON.stringify(row) }))[0]
}

export async function update<T>(table: string, where: Where, patch: Row): Promise<T[]> {
  if (!live) {
    const rows = tbl(table).filter((r) => match(r, where))
    rows.forEach((r) => Object.assign(r, patch))
    return rows as T[]
  }
  return rest<T[]>(`${table}?${filters(where).join('&')}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function remove(table: string, where: Where): Promise<void> {
  if (!live) { mem[table] = tbl(table).filter((r) => !match(r, where)); return }
  await rest(`${table}?${filters(where).join('&')}`, { method: 'DELETE' })
}

// ---------- типы ----------
export interface UserRow {
  telegram_id: number; first_name: string; last_name: string | null; username: string | null; photo_url: string | null
  full_name: string | null; phone: string | null; marketing: boolean; registered_at: string | null
  role: Role; status: 'active' | 'blocked'
}
export interface BookingRow {
  id: string; telegram_id: number; kind: string; date: string; guests: number; comment: string | null
  status: string; assigned_to: number | null; created_at: string
}
export interface ApplicationRow {
  id: string; telegram_id: number; desired_role: Role; about: string; certificates: string | null
  experience_years: number; status: 'pending' | 'approved' | 'rejected'; reviewed_by: number | null
  review_note: string | null; created_at: string
}
export interface InviteRow {
  code: string; role: Role; created_by: number; expires_at: string; used_by: number | null; used_at: string | null; created_at: string
}
export interface BeerRow {
  id: string; name: string; style: string; family: string; abv: string; ibu: number; color: string; description: string
  tasting_notes: string | null; pairing: string | null; published: boolean; sort: number
}

// ---------- обёртки ----------
export const getUser = async (id: number) => (await select<UserRow>('users', { telegram_id: id }))[0] ?? null

export async function upsertTelegramUser(u: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string }): Promise<UserRow> {
  const base = { first_name: u.first_name, last_name: u.last_name ?? null, username: u.username ?? null, photo_url: u.photo_url ?? null }
  if (await getUser(u.id)) return (await update<UserRow>('users', { telegram_id: u.id }, base))[0]
  return insert<UserRow>('users', { telegram_id: u.id, ...base, full_name: null, phone: null, marketing: false, registered_at: null, role: 'customer', status: 'active' })
}

export const saveProfile = async (id: number, p: Row) => (await update<UserRow>('users', { telegram_id: id }, p))[0]
export const createBooking = (b: Row) => insert<BookingRow>('bookings', { status: 'new', assigned_to: null, ...b })
export const listBookings = (id: number) => select<BookingRow>('bookings', { telegram_id: id }, { order: 'created_at', desc: true })
export const log = (actor: number, action: string, target: string, meta: Row = {}) =>
  insert('audit_log', { actor, action, target, meta }).catch(() => undefined)
