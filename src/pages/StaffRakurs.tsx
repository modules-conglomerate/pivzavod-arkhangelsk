import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { can } from '../lib/roles'
import { slotFormSchema, type SlotFormInput } from '../lib/schemas'
import { send, useResource } from '../lib/useResource'
import { useBeers } from '../lib/useBeers'
import type { SignupStatus, StaffSlot, User } from '../types'
import { when } from './Rakurs'

const statusLabel: Record<SignupStatus, string> = { registered: 'записан', attended: 'пришёл', no_show: 'не пришёл', cancelled: 'отменил' }
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Не удалось выполнить действие')

export function StaffRakurs() {
  const { user } = useAuth()
  const manage = can(user?.role, 'rakurs:manage')
  const slots = useResource<{ slots: StaffSlot[] }>('/api/staff/slots')
  const team = useResource<{ users: User[] }>(manage ? '/api/staff/users' : null)
  const beers = useBeers()
  const name = (id: string) => beers.find((b) => b.id === id)?.name ?? id
  const sommeliers = team.data?.users.filter((u) => u.role === 'sommelier') ?? []
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SlotFormInput>({
    resolver: zodResolver(slotFormSchema), defaultValues: { title: 'Ракурс: путь пива', capacity: 12, priceRub: 1500, sommelierId: '' },
  })
  const create = handleSubmit(async (v) => {
    try {
      await send('POST', '/api/staff/slots', {
        title: v.title, startsAt: new Date(v.startsAt).toISOString(), capacity: v.capacity, priceRub: v.priceRub,
        sommelierId: v.sommelierId ? Number(v.sommelierId) : null,
      })
      setError(''); reset(); await slots.reload()
    } catch (e) { setError(msg(e)) }
  })
  const act = async (path: string, body: object) => {
    try { await send('PATCH', path, body); setError(''); await slots.reload() } catch (e) { setError(msg(e)) }
  }
  const now = useMemo(() => Date.now(), [slots.data])

  return (
    <>
      {manage && (
        <form onSubmit={create} noValidate className="mb-8 grid gap-x-4 border border-burgundy/20 bg-ivory p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="s-title">Название</label>
            <input id="s-title" className="field" {...register('title')} /><p className="err">{errors.title?.message}</p></div>
          <div><label className="label" htmlFor="s-at">Дата и время</label>
            <input id="s-at" type="datetime-local" className="field" {...register('startsAt')} /><p className="err">{errors.startsAt?.message}</p></div>
          <div><label className="label" htmlFor="s-lead">Ведущий сомелье</label>
            <select id="s-lead" className="field" {...register('sommelierId')}>
              <option value="">Пока не назначен</option>
              {sommeliers.map((s) => <option key={s.telegram_id} value={s.telegram_id}>{s.full_name ?? s.first_name}</option>)}
            </select></div>
          <div><label className="label" htmlFor="s-cap">Мест</label>
            <input id="s-cap" type="number" className="field" {...register('capacity', { valueAsNumber: true })} /><p className="err">{errors.capacity?.message}</p></div>
          <div><label className="label" htmlFor="s-price">Цена с гостя, ₽</label>
            <input id="s-price" type="number" className="field" {...register('priceRub', { valueAsNumber: true })} /><p className="err">{errors.priceRub?.message}</p></div>
          <div className="sm:col-span-2"><button className="btn-dark">Добавить ракурс</button></div>
        </form>
      )}
      <p className="err" role="alert">{error || slots.error}</p>
      {slots.data?.slots.length === 0 && <p>Ракурсов пока нет.</p>}
      <ul className="grid gap-4">
        {slots.data?.slots.map((s) => {
          const started = new Date(s.starts_at).getTime() <= now
          const guests = s.signups.filter((x) => x.status !== 'no_show').reduce((n, x) => n + x.guests, 0)
          const demand = new Map<string, number>()
          s.signups.forEach((x) => x.set_beers.forEach((b) => demand.set(b, (demand.get(b) ?? 0) + x.guests)))
          return (
            <li key={s.id} className="border border-burgundy/20 bg-ivory p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><b className="font-serif text-lg">{s.title}</b> · {when(s.starts_at)}</span>
                <span className="text-sm text-brick">{s.status === 'open' ? 'запись открыта' : s.status === 'closed' ? 'запись закрыта' : 'отменён'} · {guests}/{s.capacity}</span>
              </div>
              {demand.size > 0 && <p className="mt-2 text-sm">К подготовке: {[...demand].map(([b, n]) => `${name(b)} ×${n}`).join(', ')}</p>}
              {manage && s.status !== 'cancelled' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select aria-label="Ведущий" className="field w-auto" value={s.sommelier_id ?? ''}
                    onChange={(e) => void act('/api/staff/slots', { id: s.id, sommelier_id: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Ведущий не назначен</option>
                    {sommeliers.map((x) => <option key={x.telegram_id} value={x.telegram_id}>{x.full_name ?? x.first_name}</option>)}
                  </select>
                  <button className="btn-dark" onClick={() => void act('/api/staff/slots', { id: s.id, status: s.status === 'open' ? 'closed' : 'open' })}>{s.status === 'open' ? 'Закрыть запись' : 'Открыть запись'}</button>
                  <button className="btn-dark" onClick={() => void act('/api/staff/slots', { id: s.id, status: 'cancelled' })}>Отменить ракурс</button>
                </div>
              )}
              <ul className="mt-3 grid gap-2">
                {s.signups.map((x) => (
                  <li key={x.id} className="border-t border-burgundy/15 pt-2 text-sm">
                    <b>{x.guest?.full_name}</b> ×{x.guests} · {x.guest?.phone} <span className="text-brick">· {statusLabel[x.status]}</span>
                    <br />Сет: {x.set_beers.map(name).join(', ')} · полный цикл: <b>{name(x.focus_beer)}</b>
                    {x.comment && <><br />«{x.comment}»</>}
                    {started && (
                      <span className="mt-1 flex gap-2">
                        <button className="btn-dark" onClick={() => void act('/api/staff/attendance', { id: x.id, status: 'attended' })}>Пришёл</button>
                        <button className="btn-dark" onClick={() => void act('/api/staff/attendance', { id: x.id, status: 'no_show' })}>Не пришёл</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </>
  )
}
