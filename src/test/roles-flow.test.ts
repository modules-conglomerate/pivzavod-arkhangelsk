import { call, tgQuery } from './helpers'

it('полный поток ролей: вход → регистрация → заявка → одобрение → приглашение → права', async () => {
  const telegram = (await import('../../api/auth/telegram')).default
  const profile = (await import('../../api/profile')).default
  const apply = (await import('../../api/apply')).default
  const invite = (await import('../../api/invite')).default
  const bookingsOwn = (await import('../../api/bookings')).default
  const staff = (await import('../../api/staff/[resource]')).default
  const me = (await import('../../api/auth/me')).default
  const st = (resource: string, o: Parameters<typeof call>[1]) => call(staff, { ...o, query: { resource, ...o.query } })

  // Администратор из ADMIN_TELEGRAM_IDS
  const a = await call(telegram, { query: tgQuery(1, 'Админ') })
  expect(a.location).toBe('/register')
  const admin = a.cookie!
  expect((await call(me, { cookie: admin })).body.user.role).toBe('admin')

  // Подделка подписи отклоняется
  expect((await call(telegram, { query: { ...tgQuery(5, 'Взлом'), id: '6' } })).status).toBe(401)

  // Гость 2: регистрация, заявка на сомелье, доступа в кабинет нет
  const g = (await call(telegram, { query: tgQuery(2, 'Анна') })).cookie!
  const reg = { fullName: 'Анна Сомелье', phone: '+7 900 123-45-67', consent: true, marketing: false }
  expect((await call(profile, { method: 'POST', cookie: g, body: reg })).status).toBe(200)
  expect((await st('beers', { cookie: g })).status).toBe(403)
  const app = await call(apply, { method: 'POST', cookie: g, body: { desiredRole: 'sommelier', experienceYears: 3, about: 'Работаю сомелье три года, сертификат Cicerone.' } })
  expect(app.status).toBe(201)
  expect((await call(apply, { method: 'POST', cookie: g, body: { desiredRole: 'manager', experienceYears: 1, about: 'Повторная заявка для проверки блокировки.' } })).status).toBe(409)

  // Гость не может рассматривать заявки, админ может
  expect((await st('applications', { cookie: g })).status).toBe(403)
  const list = await st('applications', { cookie: admin })
  expect(list.body.applications).toHaveLength(1)
  expect((await st('applications', { method: 'PATCH', cookie: admin, body: { id: app.body.application.id, decision: 'approved' } })).status).toBe(200)
  expect((await call(me, { cookie: g })).body.user.role).toBe('sommelier')

  // Сомелье правит только заметки, а не полный каталог
  expect((await st('beers', { method: 'PATCH', cookie: g, body: { id: 'severnoe', tasting_notes: 'Хлебный мякиш, цитрус' } })).status).toBe(404) // в памяти нет сидов
  expect((await st('beers', { method: 'POST', cookie: g, body: {} })).status).toBe(403)
  expect((await st('users', { cookie: g })).status).toBe(403)

  // Приглашение на менеджера: одноразовое
  const inv = await st('invites', { method: 'POST', cookie: admin, body: { role: 'manager', days: 3 } })
  const code = inv.body.invite.code
  const m = (await call(telegram, { query: tgQuery(3, 'Олег') })).cookie!
  expect((await call(invite, { method: 'POST', cookie: m, body: { code } })).body.user.role).toBe('manager')
  const other = (await call(telegram, { query: tgQuery(4, 'Иван') })).cookie!
  expect((await call(invite, { method: 'POST', cookie: other, body: { code } })).status).toBe(410)

  // Менеджер видит пользователей, но не меняет роли; админ не меняет себя
  expect((await st('users', { cookie: m })).body.users.length).toBe(4)
  expect((await st('users', { method: 'PATCH', cookie: m, body: { telegram_id: 4, role: 'admin' } })).status).toBe(403)
  expect((await st('users', { method: 'PATCH', cookie: admin, body: { telegram_id: 1, role: 'customer' } })).status).toBe(403)

  // Бронь гостя → сомелье берёт заказ своего пива → менеджер подтверждает
  await call(profile, { method: 'POST', cookie: other, body: { ...reg, fullName: 'Иван Гость' } })
  const bk = await call(bookingsOwn, { method: 'POST', cookie: other, body: { kind: 'custom-beer', date: '2999-01-01', guests: 4 } })
  expect(bk.status).toBe(201)
  const id = bk.body.booking.id
  expect((await st('bookings', { cookie: g })).body.bookings).toHaveLength(1)
  expect((await st('bookings', { method: 'PATCH', cookie: g, body: { id, assigned_to: 2 } })).status).toBe(200)
  expect((await st('bookings', { method: 'PATCH', cookie: g, body: { id, status: 'cancelled' } })).status).toBe(403)
  expect((await st('bookings', { method: 'PATCH', cookie: m, body: { id, status: 'confirmed' } })).body.booking.status).toBe('confirmed')

  // Блокировка закрывает доступ сразу
  await st('users', { method: 'PATCH', cookie: admin, body: { telegram_id: 4, status: 'blocked' } })
  expect((await call(me, { cookie: other })).body.user).toBeNull()
})
