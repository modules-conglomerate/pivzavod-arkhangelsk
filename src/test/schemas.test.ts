import { createHash, createHmac } from 'node:crypto'
import { bookingSchema, profileSchema } from '../lib/schemas'
import { verifyTelegram } from '../../api/_lib/telegram'

describe('profileSchema', () => {
  it('принимает корректные данные', () => {
    expect(profileSchema.safeParse({ fullName: 'Иван Петров', phone: '+7 900 123-45-67', consent: true, marketing: false }).success).toBe(true)
  })
  it('требует согласие и телефон', () => {
    const r = profileSchema.safeParse({ fullName: 'Иван', phone: '123', consent: false, marketing: false })
    expect(r.success).toBe(false)
  })
})

describe('bookingSchema', () => {
  it('отклоняет прошедшую дату и лишних гостей', () => {
    expect(bookingSchema.safeParse({ kind: 'table', date: '2020-01-01', guests: 2 }).success).toBe(false)
    expect(bookingSchema.safeParse({ kind: 'event', date: '2999-01-01', guests: 500 }).success).toBe(false)
    expect(bookingSchema.safeParse({ kind: 'event', date: '2999-01-01', guests: 80 }).success).toBe(true)
  })
})

describe('verifyTelegram', () => {
  const token = '123:TEST'
  const base = { id: '42', first_name: 'Аня', auth_date: String(Math.floor(Date.now() / 1000)) }
  const sign = (d: Record<string, string>) =>
    createHmac('sha256', createHash('sha256').update(token).digest())
      .update(Object.keys(d).sort().map((k) => `${k}=${d[k]}`).join('\n')).digest('hex')

  it('принимает верную подпись', () => {
    expect(verifyTelegram({ ...base, hash: sign(base) }, token)).toBe(true)
  })
  it('отклоняет подделку и устаревший вход', () => {
    expect(verifyTelegram({ ...base, id: '43', hash: sign(base) }, token)).toBe(false)
    const old = { ...base, auth_date: '1000' }
    expect(verifyTelegram({ ...old, hash: sign(old) }, token)).toBe(false)
  })
})
