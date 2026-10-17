import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/AuthContext'
import { TelegramLogin } from '../auth/TelegramLogin'
import { PageHead } from '../components/blocks'
import { api, ApiError } from '../lib/api'
import { bookingKinds, bookingLabels, bookingSchema, profileSchema, type BookingInput, type ProfileInput } from '../lib/schemas'
import { isStaff, roleLabels } from '../lib/roles'
import type { Booking, User } from '../types'

export function Login() {
  const { user } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from
  if (user) return <Navigate to={from ?? '/account'} replace />
  return (
    <>
      <PageHead title="Вход" lead="Войдите через Telegram — без паролей. Мы получим только имя и фото профиля." />
      <section className="wrap py-12">
        <TelegramLogin />
        <p className="mt-8 max-w-md border-l-4 border-gold bg-ivory p-4 text-sm">
          <b>Вы сотрудник?</b> Войдите так же, затем подайте заявку на роль сомелье или менеджера
          или откройте ссылку-приглашение от администратора. Роль администратора выдаётся только по приглашению.
        </p>
      </section>
    </>
  )
}

export function Register() {
  const { user, refresh } = useAuth()
  const nav = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name ?? [user?.first_name, user?.last_name].filter(Boolean).join(' '),
      phone: user?.phone ?? '', consent: false, marketing: user?.marketing ?? false,
    },
  })
  const submit = handleSubmit(async (v) => {
    setError('')
    try {
      await api<{ user: User }>('/api/profile', { method: 'POST', body: JSON.stringify(v) })
      await refresh()
      nav('/account')
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Не удалось сохранить') }
  })
  return (
    <>
      <PageHead title="Регистрация" lead="Осталось подтвердить контакты, чтобы мы могли подтверждать брони." />
      <form onSubmit={submit} noValidate className="wrap max-w-md py-10">
        <label className="label" htmlFor="fullName">Имя и фамилия</label>
        <input id="fullName" className="field" autoComplete="name" {...register('fullName')} />
        <p className="err">{errors.fullName?.message}</p>
        <label className="label" htmlFor="phone">Телефон</label>
        <input id="phone" type="tel" className="field" autoComplete="tel" placeholder="+7 900 123-45-67" {...register('phone')} />
        <p className="err">{errors.phone?.message}</p>
        <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" {...register('consent')} />Согласен на обработку персональных данных</label>
        <p className="err">{errors.consent?.message}</p>
        <label className="mt-2 flex gap-2 text-sm"><input type="checkbox" {...register('marketing')} />Присылать новости и события в Telegram</label>
        <p className="err" role="alert">{error}</p>
        <button className="btn-dark mt-4" disabled={isSubmitting}>Завершить регистрацию</button>
      </form>
    </>
  )
}

export function Booking() {
  const nav = useNavigate()
  const kind = new URLSearchParams(useLocation().search).get('kind')
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { kind: bookingKinds.find((k) => k === kind) ?? 'table', guests: 2 },
  })
  const submit = handleSubmit(async (v) => {
    setError('')
    try {
      await api('/api/bookings', { method: 'POST', body: JSON.stringify(v) })
      nav('/account')
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Не удалось отправить заявку') }
  })
  return (
    <>
      <PageHead title="Бронирование" lead="Администратор свяжется с вами в Telegram или по телефону." />
      <form onSubmit={submit} noValidate className="wrap max-w-md py-10">
        <label className="label" htmlFor="kind">Что бронируем</label>
        <select id="kind" className="field" {...register('kind')}>
          {bookingKinds.map((k) => <option key={k} value={k}>{bookingLabels[k]}</option>)}
        </select>
        <label className="label" htmlFor="date">Дата</label>
        <input id="date" type="date" className="field" {...register('date')} />
        <p className="err">{errors.date?.message}</p>
        <label className="label" htmlFor="guests">Гостей</label>
        <input id="guests" type="number" className="field" {...register('guests', { valueAsNumber: true })} />
        <p className="err">{errors.guests?.message}</p>
        <label className="label" htmlFor="comment">Комментарий</label>
        <textarea id="comment" rows={3} className="field" {...register('comment')} />
        <p className="err" role="alert">{error || errors.comment?.message}</p>
        <button className="btn-dark mt-4" disabled={isSubmitting}>Отправить заявку</button>
      </form>
    </>
  )
}

export function Account() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Booking[] | null>(null)
  useEffect(() => {
    api<{ bookings: Booking[] }>('/api/bookings').then((r) => setItems(r.bookings)).catch(() => setItems([]))
  }, [])
  return (
    <>
      <PageHead title="Личный кабинет" lead={user?.full_name ?? user?.first_name} />
      <section className="wrap grid gap-10 py-10 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-2xl">Профиль</h2>
          <p className="mb-1 inline-block bg-burgundy px-2 py-0.5 text-xs uppercase tracking-widest text-gold">{roleLabels[user!.role]}</p>
          <p>{user?.phone}</p>
          {user?.username && <p className="text-charcoal/70">@{user.username}</p>}
          <div className="mt-5 flex gap-3">
            <Link to="/register" className="btn-dark">Изменить</Link>
            <Link to="/passport" className="btn-dark">Паспорт</Link>
            {isStaff(user?.role) && <Link to="/staff" className="btn-dark">Кабинет</Link>}
            {!isStaff(user?.role) && <Link to="/apply" className="btn-dark">Работать у нас</Link>}
            <button className="btn-dark" onClick={() => void logout()}>Выйти</button>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-2xl">Мои заявки</h2>
          {items === null ? <p>Загрузка…</p> : items.length === 0 ? (
            <p>Заявок пока нет. <Link to="/booking" className="underline">Забронировать</Link></p>
          ) : (
            <ul>{items.map((b) => (
              <li key={b.id} className="border-b border-burgundy/20 py-3">
                <b>{bookingLabels[b.kind]}</b> · {b.date} · {b.guests} гост.
                <span className="ml-2 text-sm text-brick">{b.status === 'new' ? 'на рассмотрении' : b.status}</span>
              </li>
            ))}</ul>
          )}
        </div>
      </section>
    </>
  )
}
