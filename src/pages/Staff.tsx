import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/AuthContext'
import { TelegramLogin } from '../auth/TelegramLogin'
import { PageHead } from '../components/blocks'
import { ApiError, api } from '../lib/api'
import { can, applicableRoles, roleLabels, roles, type Permission } from '../lib/roles'
import {
  applicationSchema, beerNotesSchema, beerSchema, bookingLabels, bookingStatuses, bookingStatusLabels,
  inviteCreateSchema, type ApplicationInput, type BeerInput, type InviteCreateInput,
} from '../lib/schemas'
import { send, useResource } from '../lib/useResource'
import type { Application, BeerRow, Invite, StaffBooking, User } from '../types'

const fmt = (s: string) => new Date(s).toLocaleDateString('ru-RU')
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Не удалось выполнить действие')
const Err = ({ text }: { text: string }) => <p className="err" role="alert">{text}</p>
const Card = ({ children }: { children: React.ReactNode }) => <li className="border border-burgundy/20 bg-ivory p-4">{children}</li>

// ---------- Регистрация персонала ----------
export function Apply() {
  const { data, reload } = useResource<{ applications: Application[] }>('/api/apply')
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema), defaultValues: { desiredRole: 'sommelier', experienceYears: 0 },
  })
  const submit = handleSubmit(async (v) => {
    try { await send('POST', '/api/apply', v); setError(''); await reload() } catch (e) { setError(msg(e)) }
  })
  const last = data?.applications[0]
  return (
    <>
      <PageHead title="Работа в Пивзаводе" lead="Заявка на роль сомелье или менеджера. Решение принимает администратор." />
      <section className="wrap max-w-md py-10">
        {last && (
          <p className="mb-6 border-l-4 border-gold bg-ivory p-4 text-sm">
            Заявка на роль «{roleLabels[last.desired_role]}» от {fmt(last.created_at)}:{' '}
            <b>{last.status === 'pending' ? 'на рассмотрении' : last.status === 'approved' ? 'одобрена' : 'отклонена'}</b>
            {last.review_note && <><br />Комментарий: {last.review_note}</>}
          </p>
        )}
        {last?.status !== 'pending' && (
          <form onSubmit={submit} noValidate>
            <label className="label" htmlFor="desiredRole">Роль</label>
            <select id="desiredRole" className="field" {...register('desiredRole')}>
              {applicableRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select>
            <label className="label" htmlFor="experienceYears">Стаж, лет</label>
            <input id="experienceYears" type="number" className="field" {...register('experienceYears', { valueAsNumber: true })} />
            <Err text={errors.experienceYears?.message ?? ''} />
            <label className="label" htmlFor="certificates">Сертификаты (Cicerone, BJCP, WSET…)</label>
            <input id="certificates" className="field" {...register('certificates')} />
            <label className="label" htmlFor="about">О себе</label>
            <textarea id="about" rows={5} className="field" {...register('about')} />
            <Err text={errors.about?.message ?? error} />
            <button className="btn-dark mt-3" disabled={isSubmitting}>Отправить заявку</button>
          </form>
        )}
        <p className="mt-6 text-sm text-charcoal/70">Есть ссылка-приглашение? Просто откройте её, роль выдастся сразу. Администраторов назначает владелец.</p>
      </section>
    </>
  )
}

export function InvitePage() {
  const { code = '' } = useParams()
  const { user, refresh } = useAuth()
  const go = useNavigate()
  const [error, setError] = useState('')
  const redeem = async () => {
    try {
      await send('POST', '/api/invite', { code })
      sessionStorage.removeItem('pz_invite')
      await refresh()
      go('/staff')
    } catch (e) { setError(msg(e)) }
  }
  if (!user) sessionStorage.setItem('pz_invite', code)
  else if (!user.registered_at) { sessionStorage.setItem('pz_invite', code); return <Navigate to="/register" replace /> }
  return (
    <>
      <PageHead title="Приглашение в команду" lead="Войдите через Telegram и подтвердите приглашение." />
      <section className="wrap py-10">
        {user ? <button className="btn-dark" onClick={() => void redeem()}>Принять приглашение</button> : <TelegramLogin />}
        <Err text={error} />
        {error && <Link to="/account" className="text-sm underline" onClick={() => sessionStorage.removeItem('pz_invite')}>В личный кабинет</Link>}
      </section>
    </>
  )
}

// ---------- Кабинет персонала ----------
const tabs: { to: string; label: string; perm: Permission[] }[] = [
  { to: 'bookings', label: 'Заявки', perm: ['bookings:view_all', 'bookings:view_assigned'] },
  { to: 'rakurs', label: 'Ракурсы', perm: ['rakurs:view'] },
  { to: 'beers', label: 'Пиво', perm: ['beers:notes'] },
  { to: 'users', label: 'Пользователи', perm: ['users:view'] },
  { to: 'waitlist', label: 'Список ожидания', perm: ['users:view'] },
  { to: 'applications', label: 'Заявки персонала', perm: ['applications:review'] },
  { to: 'invites', label: 'Приглашения', perm: ['invites:manage'] },
]

export function StaffLayout() {
  const { user } = useAuth()
  const mine = tabs.filter((t) => t.perm.some((p) => can(user?.role, p)))
  return (
    <>
      <PageHead title="Кабинет" lead={`${user?.full_name ?? user?.first_name} · ${roleLabels[user!.role]}`} />
      <div className="wrap py-8">
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Разделы кабинета">
          {mine.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => `border px-4 py-2 text-sm ${isActive ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/40'}`}>{t.label}</NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </>
  )
}
export function StaffIndex() {
  const { user } = useAuth()
  const first = tabs.find((t) => t.perm.some((p) => can(user?.role, p)))
  return <Navigate to={first?.to ?? '/account'} replace />
}

export function StaffBookings() {
  const { user } = useAuth()
  const manage = can(user?.role, 'bookings:manage')
  const list = useResource<{ bookings: StaffBooking[] }>('/api/staff/bookings')
  const team = useResource<{ users: User[] }>(manage ? '/api/staff/users' : null)
  const [error, setError] = useState('')
  const patch = async (id: string, body: object) => {
    try { await send('PATCH', '/api/staff/bookings', { id, ...body }); setError(''); await list.reload() } catch (e) { setError(msg(e)) }
  }
  const sommeliers = team.data?.users.filter((u) => u.role === 'sommelier') ?? []
  const me = user!.telegram_id
  return (
    <>
      <Err text={error || list.error} />
      {list.data?.bookings.length === 0 && <p>Заявок пока нет.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {list.data?.bookings.map((b) => (
          <Card key={b.id}>
            <b>{bookingLabels[b.kind]}</b> · {fmt(b.date)} · {b.guests} гост.
            <p className="text-sm">{b.guest?.full_name} · {b.guest?.phone} {b.guest?.username && `· @${b.guest.username}`}</p>
            {b.comment && <p className="text-sm italic">«{b.comment}»</p>}
            {manage ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select aria-label="Статус" className="field" value={b.status} onChange={(e) => void patch(b.id, { status: e.target.value })}>
                  {bookingStatuses.map((s) => <option key={s} value={s}>{bookingStatusLabels[s]}</option>)}
                </select>
                <select aria-label="Сомелье" className="field" value={b.assigned_to ?? ''} onChange={(e) => void patch(b.id, { assigned_to: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">Не назначен</option>
                  {sommeliers.map((s) => <option key={s.telegram_id} value={s.telegram_id}>{s.full_name ?? s.first_name}</option>)}
                </select>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-brick">{bookingStatusLabels[b.status]}</span>
                {b.assigned_to === null && <button className="btn-dark" onClick={() => void patch(b.id, { assigned_to: me })}>Взять</button>}
                {b.assigned_to === me && (<>
                  {b.status === 'new' && <button className="btn-dark" onClick={() => void patch(b.id, { status: 'confirmed' })}>Подтвердить</button>}
                  {b.status === 'confirmed' && <button className="btn-dark" onClick={() => void patch(b.id, { status: 'done' })}>Проведена</button>}
                  <button className="btn-dark" onClick={() => void patch(b.id, { assigned_to: null })}>Отпустить</button>
                </>)}
              </div>
            )}
          </Card>
        ))}
      </ul>
    </>
  )
}

function BeerEditor({ beer, manage, onDone }: { beer?: BeerRow; manage: boolean; onDone: () => void }) {
  const [error, setError] = useState('')
  const schema = manage ? beerSchema : beerNotesSchema
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BeerInput>({
    resolver: zodResolver(schema) as unknown as Resolver<BeerInput>,
    defaultValues: beer
      ? { ...beer, tasting_notes: beer.tasting_notes ?? '', pairing: beer.pairing ?? '' }
      : { family: 'light', color: '#D9A04D', ibu: 20, abv: '', published: true, sort: 10, description: '' },
  })
  const submit = handleSubmit(async (v) => {
    try {
      if (!beer) await send('POST', '/api/staff/beers', v)
      else await send('PATCH', '/api/staff/beers', manage ? v : { id: beer.id, tasting_notes: v.tasting_notes, pairing: v.pairing })
      onDone()
    } catch (e) { setError(msg(e)) }
  })
  const f = (label: string, name: keyof BeerInput, extra: object = {}, type = 'text') => (
    <div>
      <label className="label" htmlFor={`b-${name}`}>{label}</label>
      <input id={`b-${name}`} type={type} className="field" {...register(name, extra)} />
      <Err text={errors[name]?.message ?? ''} />
    </div>
  )
  return (
    <form onSubmit={submit} noValidate className="mt-3">
      {manage && (
        <div className="grid gap-x-4 sm:grid-cols-2">
          {!beer && f('Код (латиницей)', 'id')}
          {f('Название', 'name')}{f('Стиль', 'style')}
          <div><label className="label" htmlFor="b-family">Семейство</label>
            <select id="b-family" className="field" {...register('family')}><option value="light">Светлое</option><option value="red">Красное</option><option value="dark">Тёмное</option></select></div>
          {f('Крепость', 'abv')}{f('IBU', 'ibu', { valueAsNumber: true }, 'number')}{f('Цвет', 'color')}{f('Порядок', 'sort', { valueAsNumber: true }, 'number')}
          {f('Описание', 'description')}
        </div>
      )}
      <label className="label" htmlFor="b-notes">Заметки сомелье</label>
      <textarea id="b-notes" rows={3} className="field" {...register('tasting_notes')} />
      <Err text={errors.tasting_notes?.message ?? ''} />
      {f('Сочетания с едой', 'pairing')}
      {manage && <label className="mt-2 flex gap-2 text-sm"><input type="checkbox" {...register('published')} />Показывать на сайте</label>}
      <Err text={error} />
      <button className="btn-dark mt-2" disabled={isSubmitting}>Сохранить</button>
    </form>
  )
}

export function StaffBeers() {
  const { user } = useAuth()
  const manage = can(user?.role, 'beers:manage')
  const { data, error, reload } = useResource<{ beers: BeerRow[] }>('/api/staff/beers')
  const [open, setOpen] = useState<string | null>(null)
  const done = () => { setOpen(null); void reload() }
  return (
    <>
      <Err text={error} />
      {manage && <button className="btn-dark mb-4" onClick={() => setOpen('new')}>Добавить сорт</button>}
      {open === 'new' && <div className="mb-4 border border-burgundy/20 bg-ivory p-4"><BeerEditor manage onDone={done} /></div>}
      <ul className="grid gap-3">
        {data?.beers.map((b) => (
          <Card key={b.id}>
            <div className="flex items-center justify-between gap-3">
              <span><b>{b.name}</b> · {b.style} {!b.published && <em className="text-brick">(скрыт)</em>}</span>
              <span className="flex gap-2">
                <button className="btn-dark" onClick={() => setOpen(open === b.id ? null : b.id)}>{manage ? 'Править' : 'Заметки'}</button>
                {manage && <button className="btn-dark" onClick={() => void send('DELETE', `/api/staff/beers?id=${b.id}`).then(reload)}>Удалить</button>}
              </span>
            </div>
            {open === b.id && <BeerEditor beer={b} manage={manage} onDone={done} />}
          </Card>
        ))}
      </ul>
    </>
  )
}

export function StaffUsers() {
  const { user } = useAuth()
  const manage = can(user?.role, 'users:manage')
  const { data, error, reload } = useResource<{ users: User[] }>('/api/staff/users')
  const [err, setErr] = useState('')
  const patch = async (telegram_id: number, body: object) => {
    try { await send('PATCH', '/api/staff/users', { telegram_id, ...body }); setErr(''); await reload() } catch (e) { setErr(msg(e)) }
  }
  return (
    <>
      <Err text={err || error} />
      <ul className="grid gap-3 md:grid-cols-2">
        {data?.users.map((u) => (
          <Card key={u.telegram_id}>
            <b>{u.full_name ?? u.first_name}</b> {u.username && <span className="text-sm">@{u.username}</span>}
            <p className="text-sm">{u.phone ?? 'телефон не указан'} {u.status === 'blocked' && <em className="text-brick">· заблокирован</em>}</p>
            {manage && u.telegram_id !== user!.telegram_id ? (
              <div className="mt-2 flex gap-2">
                <select aria-label="Роль" className="field" value={u.role} onChange={(e) => void patch(u.telegram_id, { role: e.target.value })}>
                  {roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                </select>
                <button className="btn-dark" onClick={() => void patch(u.telegram_id, { status: u.status === 'active' ? 'blocked' : 'active' })}>{u.status === 'active' ? 'Блок' : 'Разблок'}</button>
              </div>
            ) : <p className="mt-1 text-sm text-brick">{roleLabels[u.role]}</p>}
          </Card>
        ))}
      </ul>
    </>
  )
}

export function StaffApplications() {
  const { data, error, reload } = useResource<{ applications: Application[] }>('/api/staff/applications')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')
  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    try { await send('PATCH', '/api/staff/applications', { id, decision, note: notes[id] }); setErr(''); await reload() } catch (e) { setErr(msg(e)) }
  }
  return (
    <>
      <Err text={err || error} />
      {data?.applications.length === 0 && <p>Заявок пока нет.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {data?.applications.map((a) => (
          <Card key={a.id}>
            <b>{a.applicant?.full_name}</b> → {roleLabels[a.desired_role]} · стаж {a.experience_years} лет
            <p className="text-sm">{a.applicant?.phone} {a.applicant?.username && `· @${a.applicant.username}`}</p>
            {a.certificates && <p className="text-sm">Сертификаты: {a.certificates}</p>}
            <p className="my-2 text-sm">{a.about}</p>
            {a.status === 'pending' ? (
              <>
                <input aria-label="Комментарий" placeholder="Комментарий (необязательно)" className="field" value={notes[a.id] ?? ''} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
                <div className="mt-2 flex gap-2">
                  <button className="btn-dark" onClick={() => void decide(a.id, 'approved')}>Одобрить</button>
                  <button className="btn-dark" onClick={() => void decide(a.id, 'rejected')}>Отклонить</button>
                </div>
              </>
            ) : <p className="text-sm text-brick">{a.status === 'approved' ? 'Одобрена' : 'Отклонена'} {a.review_note && `· ${a.review_note}`}</p>}
          </Card>
        ))}
      </ul>
    </>
  )
}

export function StaffInvites() {
  const { data, error, reload } = useResource<{ invites: Invite[] }>('/api/staff/invites')
  const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<InviteCreateInput>({
    resolver: zodResolver(inviteCreateSchema), defaultValues: { role: 'sommelier', days: 7 },
  })
  const create = handleSubmit(async (v) => {
    try { await api('/api/staff/invites', { method: 'POST', body: JSON.stringify(v) }); setErr(''); await reload() } catch (e) { setErr(msg(e)) }
  })
  const url = (c: string) => `${window.location.origin}/invite/${c}`
  const state = (i: Invite) => (i.used_by ? 'использовано' : new Date(i.expires_at) < new Date() ? 'истекло' : `действует до ${fmt(i.expires_at)}`)
  return (
    <>
      <form onSubmit={create} noValidate className="mb-6 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="inv-role">Роль</label>
          <select id="inv-role" className="field" {...register('role')}>
            {(['sommelier', 'manager', 'admin'] as const).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select></div>
        <div><label className="label" htmlFor="inv-days">Дней</label>
          <input id="inv-days" type="number" className="field w-24" {...register('days', { valueAsNumber: true })} /></div>
        <button className="btn-dark">Создать ссылку</button>
      </form>
      <Err text={err || error || errors.days?.message || ''} />
      <ul className="grid gap-3">
        {data?.invites.map((i) => (
          <Card key={i.code}>
            <b>{roleLabels[i.role]}</b> · {state(i)}
            <p className="break-all text-xs">{url(i.code)}</p>
            {!i.used_by && new Date(i.expires_at) > new Date() && (
              <div className="mt-2 flex gap-2">
                <button className="btn-dark" onClick={() => void navigator.clipboard.writeText(url(i.code))}>Копировать</button>
                <button className="btn-dark" onClick={() => void send('DELETE', `/api/staff/invites?code=${i.code}`).then(reload)}>Отозвать</button>
              </div>
            )}
          </Card>
        ))}
      </ul>
    </>
  )
}
