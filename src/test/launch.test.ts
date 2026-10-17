import { getLaunch, plural, splitDuration } from '../lib/launch'
import { normalizeContact } from '../lib/schemas'

describe('режим заставки', () => {
  const now = Date.parse('2026-11-01T00:00:00Z')
  it('ничего не задано — сайт открыт', () => {
    expect(getLaunch({}, now)).toEqual({ active: false, at: null })
  })
  it('дата в будущем — заставка с таймером, после даты — сайт открыт', () => {
    expect(getLaunch({ VITE_LAUNCH_AT: '2026-12-01T12:00:00+03:00' }, now)).toMatchObject({ active: true })
    expect(getLaunch({ VITE_LAUNCH_AT: '2026-10-01T12:00:00+03:00' }, now).active).toBe(false)
  })
  it('флаг без даты — заставка без таймера; битая дата игнорируется', () => {
    expect(getLaunch({ VITE_COMING_SOON: '1' }, now)).toEqual({ active: true, at: null })
    expect(getLaunch({ VITE_LAUNCH_AT: 'завтра', VITE_COMING_SOON: '1' }, now)).toEqual({ active: true, at: null })
  })
})

describe('таймер', () => {
  it('раскладывает время и не уходит в минус', () => {
    expect(splitDuration(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
    expect(splitDuration(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
  it('склоняет по-русски', () => {
    const d: [string, string, string] = ['день', 'дня', 'дней']
    expect([1, 2, 5, 11, 12, 21, 22, 25].map((n) => plural(n, d))).toEqual(['день', 'дня', 'дней', 'дней', 'дней', 'день', 'дня', 'дней'])
  })
})

describe('контакты списка ожидания', () => {
  it('нормализует почту и телефон', () => {
    expect(normalizeContact(' Ivan@Mail.RU ')).toEqual({ kind: 'email', value: 'ivan@mail.ru' })
    expect(normalizeContact('8 (900) 123-45-67')).toEqual({ kind: 'phone', value: '+79001234567' })
    expect(normalizeContact('+7 900 123 45 67')).toEqual({ kind: 'phone', value: '+79001234567' })
  })
  it('отвергает мусор', () => {
    expect(normalizeContact('привет')).toBeNull()
    expect(normalizeContact('12345')).toBeNull()
    expect(normalizeContact('a@b')).toBeNull()
  })
})
