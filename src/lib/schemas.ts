import { z } from 'zod'
import { applicableRoles, roles } from './roles'

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Укажите имя и фамилию').max(80, 'Слишком длинное имя'),
  phone: z.string().regex(/^\+?[\d\s()-]{10,20}$/, 'Телефон в формате +7 900 123-45-67'),
  consent: z.boolean().refine((v) => v, 'Нужно согласие на обработку персональных данных'),
  marketing: z.boolean(),
})
export type ProfileInput = z.infer<typeof profileSchema>

// Запись на ракурсы идёт через расписание (/rakurs); 'tour' оставлен только для старых заявок.
export const bookingKinds = ['table', 'event', 'custom-beer'] as const
export const bookingLabels: Record<string, string> = {
  table: 'Столик в ресторане',
  tour: 'Ракурс (старая заявка)',
  event: 'Событие или зал',
  'custom-beer': 'Своё пиво',
}

export const bookingSchema = z.object({
  kind: z.enum(bookingKinds),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Выберите дату')
    .refine((d) => d >= new Date().toISOString().slice(0, 10), 'Дата не может быть в прошлом'),
  guests: z.number({ invalid_type_error: 'Укажите число гостей' }).int().min(1, 'Минимум 1 гость').max(120, 'Зал вмещает до 120 гостей'),
  comment: z.string().max(500, 'Не больше 500 символов').optional(),
})
export type BookingInput = z.infer<typeof bookingSchema>

export const bookingStatuses = ['new', 'confirmed', 'done', 'cancelled'] as const
export const bookingStatusLabels: Record<(typeof bookingStatuses)[number], string> = {
  new: 'Новая', confirmed: 'Подтверждена', done: 'Проведена', cancelled: 'Отменена',
}
export const bookingPatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(bookingStatuses).optional(),
  assigned_to: z.number().nullable().optional(),
})

export const applicationSchema = z.object({
  desiredRole: z.enum(applicableRoles),
  experienceYears: z.number({ invalid_type_error: 'Укажите стаж в годах' }).int().min(0, 'Не меньше 0').max(60, 'Проверьте стаж'),
  certificates: z.string().max(300, 'Не больше 300 символов').optional(),
  about: z.string().trim().min(20, 'Расскажите о себе хотя бы в двух предложениях').max(1000, 'Не больше 1000 символов'),
})
export type ApplicationInput = z.infer<typeof applicationSchema>

export const inviteCreateSchema = z.object({
  role: z.enum(['sommelier', 'manager', 'admin']),
  days: z.number({ invalid_type_error: 'Укажите срок' }).int().min(1, 'Минимум 1 день').max(30, 'Максимум 30 дней'),
})
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>

export const userPatchSchema = z.object({
  telegram_id: z.number(),
  role: z.enum(roles).optional(),
  status: z.enum(['active', 'blocked']).optional(),
})
export const decisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().max(300).optional(),
})

export const beerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/, 'Латиница, цифры и дефис, 2–40 символов'),
  name: z.string().trim().min(2, 'Название обязательно').max(60),
  style: z.string().trim().min(2, 'Стиль обязателен').max(60),
  family: z.enum(['light', 'red', 'dark']),
  abv: z.string().max(10),
  ibu: z.number({ invalid_type_error: 'Укажите IBU' }).int().min(0).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Цвет вида #D9A04D'),
  description: z.string().max(300, 'Не больше 300 символов'),
  tasting_notes: z.string().max(600, 'Не больше 600 символов').optional(),
  pairing: z.string().max(300, 'Не больше 300 символов').optional(),
  published: z.boolean(),
  sort: z.number().int().min(0).max(999),
})
export type BeerInput = z.infer<typeof beerSchema>
export const beerNotesSchema = beerSchema.pick({ tasting_notes: true, pairing: true })

export const MAX_SET = 4
export const rakursSignupSchema = z
  .object({
    slotId: z.string().min(1),
    setBeers: z.array(z.string().min(1)).min(1, 'Выберите хотя бы один сорт для сета').max(MAX_SET, `В сете не больше ${MAX_SET} сортов`),
    focusBeer: z.string().min(1, 'Выберите сорт, чей полный цикл хотите увидеть'),
    guests: z.number({ invalid_type_error: 'Укажите число гостей' }).int().min(1, 'Минимум 1 гость').max(10, 'До 10 гостей в одной записи'),
    comment: z.string().max(300, 'Не больше 300 символов').optional(),
  })
  .refine((v) => v.setBeers.includes(v.focusBeer), { message: 'Сорт для полного цикла должен быть в вашем сете', path: ['focusBeer'] })
  .refine((v) => new Set(v.setBeers).size === v.setBeers.length, { message: 'Сорта в сете не должны повторяться', path: ['setBeers'] })
export type RakursSignupInput = z.infer<typeof rakursSignupSchema>

export const slotCreateSchema = z.object({
  title: z.string().trim().min(3, 'Название слишком короткое').max(80, 'Не больше 80 символов'),
  startsAt: z.string().datetime({ message: 'Некорректная дата' }).refine((d) => new Date(d) > new Date(), 'Дата должна быть в будущем'),
  capacity: z.number().int().min(1, 'Минимум 1 место').max(30, 'Максимум 30 мест'),
  priceRub: z.number().int().min(0).max(20000),
  sommelierId: z.number().nullable(),
})
export const slotFormSchema = z.object({
  title: z.string().trim().min(3, 'Название слишком короткое').max(80, 'Не больше 80 символов'),
  startsAt: z.string().min(1, 'Укажите дату и время'),
  capacity: z.number({ invalid_type_error: 'Укажите число мест' }).int().min(1, 'Минимум 1 место').max(30, 'Максимум 30 мест'),
  priceRub: z.number({ invalid_type_error: 'Укажите цену' }).int().min(0, 'Не меньше 0').max(20000, 'Проверьте цену'),
  sommelierId: z.string(),
})
export type SlotFormInput = z.infer<typeof slotFormSchema>
export const slotPatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'closed', 'cancelled']).optional(),
  sommelier_id: z.number().nullable().optional(),
})
export const attendanceSchema = z.object({ id: z.string().min(1), status: z.enum(['registered', 'attended', 'no_show']) })

/** Список ожидания: почта или телефон. Возвращает нормализованный контакт либо null. */
export function normalizeContact(raw: string): { kind: 'email' | 'phone'; value: string } | null {
  const s = raw.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return { kind: 'email', value: s.toLowerCase() }
  let d = s.replace(/[^\d]/g, '')
  if (d.length === 11 && d.startsWith('8')) d = `7${d.slice(1)}`
  if (/^[+\d][\d\s()-]+$/.test(s) && d.length >= 10 && d.length <= 15) return { kind: 'phone', value: `+${d}` }
  return null
}
export const waitlistSchema = z.object({
  contact: z.string().trim().min(5, 'Укажите почту или телефон').max(120, 'Слишком длинное значение')
    .refine((c) => normalizeContact(c) !== null, 'Введите почту или телефон полностью'),
  consent: z.boolean().refine((v) => v, 'Нужно согласие на обработку данных'),
  website: z.string().optional(), // ловушка для ботов: люди это поле не видят
})
export type WaitlistInput = z.infer<typeof waitlistSchema>
