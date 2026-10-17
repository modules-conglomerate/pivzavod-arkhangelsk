import { call, tgQuery } from './helpers'

it('список ожидания: подписка, нормализация, дубли, ловушка для ботов, доступ персонала', async () => {
  const waitlist = (await import('../../api/waitlist')).default
  const telegram = (await import('../../api/auth/telegram')).default
  const staff = (await import('../../api/staff/[resource]')).default
  const list = (cookie?: string) => call(staff, { query: { resource: 'waitlist' }, cookie })
  const join = (body: object) => call(waitlist, { method: 'POST', body })

  expect((await join({ contact: 'Ivan@Mail.ru', consent: true })).status).toBe(200)
  expect((await join({ contact: 'ivan@mail.ru', consent: true })).status).toBe(200) // дубль
  expect((await join({ contact: '8 (900) 123-45-67', consent: true })).status).toBe(200)
  expect((await join({ contact: 'ivan2@mail.ru', consent: false })).status).toBe(400) // без согласия
  expect((await join({ contact: 'не контакт', consent: true })).status).toBe(400)
  expect((await join({ contact: 'bot@spam.ru', consent: true, website: 'http://spam' })).status).toBe(200) // бот: принято, но не сохранено

  const admin = (await call(telegram, { query: tgQuery(1, 'Админ') })).cookie!
  const guest = (await call(telegram, { query: tgQuery(9, 'Гость') })).cookie!
  expect((await list()).status).toBe(401)
  expect((await list(guest)).status).toBe(403)
  const contacts = (await list(admin)).body.entries.map((e: { contact: string }) => e.contact).sort()
  expect(contacts).toEqual(['+79001234567', 'ivan@mail.ru'])
})
