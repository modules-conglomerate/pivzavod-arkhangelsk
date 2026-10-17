import { beers } from '../content/beers'
import { buildPassport } from '../lib/achievements'
import { call, tgQuery } from './helpers'

it('ракурсы: расписание → сет → записи и места → отметка → паспорт', async () => {
  const telegram = (await import('../../api/auth/telegram')).default
  const profile = (await import('../../api/profile')).default
  const rakurs = (await import('../../api/rakurs')).default
  const staff = (await import('../../api/staff/[resource]')).default
  const db = await import('../../api/_lib/db')
  const st = (resource: string, o: Parameters<typeof call>[1]) => call(staff, { ...o, query: { resource, ...o.query } })
  const reg = { fullName: 'Гость Тестовый', phone: '+7 900 123-45-67', consent: true, marketing: false }

  const admin = (await call(telegram, { query: tgQuery(1, 'Админ') })).cookie!
  const lead = (await call(telegram, { query: tgQuery(2, 'Анна') })).cookie!
  const other = (await call(telegram, { query: tgQuery(3, 'Борис') })).cookie!
  const guest = (await call(telegram, { query: tgQuery(4, 'Иван') })).cookie!
  for (const [id, role] of [[2, 'sommelier'], [3, 'sommelier']] as const) await st('users', { method: 'PATCH', cookie: admin, body: { telegram_id: id, role } })
  await call(profile, { method: 'POST', cookie: guest, body: reg })

  // Создавать ракурсы может только менеджер/админ, дата только в будущем
  const startsAt = new Date(Date.now() + 3 * 86400_000).toISOString()
  const body = { title: 'Ракурс: путь пива', startsAt, capacity: 5, priceRub: 1500, sommelierId: 2 }
  expect((await st('slots', { method: 'POST', cookie: guest, body })).status).toBe(403)
  expect((await st('slots', { method: 'POST', cookie: lead, body })).status).toBe(403)
  expect((await st('slots', { method: 'POST', cookie: admin, body: { ...body, startsAt: '2020-01-01T10:00:00.000Z' } })).status).toBe(400)
  expect((await st('slots', { method: 'POST', cookie: admin, body })).status).toBe(201)

  const slot = (await call(rakurs, {})).body.slots[0]
  expect(slot).toMatchObject({ capacity: 5, free: 5, lead: 'Анна' })

  // Сет: проверки состава, фокуса и мест
  const mk = (o: object) => ({ slotId: slot.id, setBeers: ['severnoe', 'kiprey', 'belomorskiy'], focusBeer: 'kiprey', guests: 2, ...o })
  const post = (b: object, cookie = guest) => call(rakurs, { method: 'POST', cookie, body: b })
  expect((await post(mk({ focusBeer: 'arhangelskoe' }))).status).toBe(400)
  expect((await post(mk({ setBeers: ['a', 'b', 'c', 'd', 'e'] }))).status).toBe(400)
  expect((await post(mk({ setBeers: ['severnoe', 'vydumannoe'], focusBeer: 'severnoe' }))).status).toBe(400)
  expect((await post(mk({ guests: 6 }))).status).toBe(409)
  const ok = await post(mk({}))
  expect(ok.status).toBe(201)
  expect((await post(mk({}))).status).toBe(409) // повторная запись
  expect((await call(rakurs, {})).body.slots[0].free).toBe(3)

  // Отмена возвращает места, чужую запись отменить нельзя
  expect((await call(rakurs, { method: 'DELETE', query: { id: ok.body.signup.id }, cookie: other })).status).toBe(404)
  expect((await call(rakurs, { method: 'DELETE', query: { id: ok.body.signup.id }, cookie: guest })).status).toBe(204)
  expect((await call(rakurs, {})).body.slots[0].free).toBe(5)

  // Отметка до начала невозможна
  const again = await post(mk({}))
  expect((await st('attendance', { method: 'PATCH', cookie: lead, body: { id: again.body.signup.id, status: 'attended' } })).status).toBe(409)

  // Прошедший ракурс: отмечает только назначенный сомелье, менеджер/админ могут любой
  const past = await db.insert<{ id: string }>('rakurs_slots', { title: 'Прошлый ракурс', starts_at: new Date(Date.now() - 86400_000).toISOString(), capacity: 10, price_rub: 0, sommelier_id: 2, status: 'open', created_by: 1 })
  const su = await db.insert<{ id: string }>('rakurs_signups', { slot_id: past.id, telegram_id: 4, guests: 1, set_beers: beers.map((b) => b.id), focus_beer: 'severnoe', comment: null, status: 'registered' })
  const mark = (cookie: string) => st('attendance', { method: 'PATCH', cookie, body: { id: su.id, status: 'attended' } })
  expect((await mark(guest)).status).toBe(403)
  expect((await mark(other)).status).toBe(403)
  expect((await st('slots', { cookie: other })).body.slots).toHaveLength(0) // чужие ракурсы не видны
  expect((await st('slots', { cookie: lead })).body.slots.length).toBe(2)
  expect((await mark(lead)).status).toBe(200)

  // Паспорт считается только по отмеченным визитам
  const mine = (await call(rakurs, { query: { mine: '1' }, cookie: guest })).body.signups
  const passport = buildPassport(mine, beers)
  expect(passport.visits).toBe(1)
  expect(passport.tried).toHaveLength(4)
  expect(passport.cycles).toEqual(['severnoe'])
  const earned = passport.badges.filter((b) => b.earned).map((b) => b.id)
  expect(earned).toEqual(expect.arrayContaining(['first', 'quartet', 'cycle', 'dark', 'all']))
  expect(earned).not.toContain('regular')
})
