import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export type TgData = Record<string, string>

/** Проверка подписи Telegram Login Widget: https://core.telegram.org/widgets/login#checking-authorization */
export function verifyTelegram(data: TgData, botToken: string, now = Date.now()): boolean {
  const { hash, ...rest } = data
  if (!hash || !rest.id || !rest.auth_date) return false
  const check = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n')
  const secret = createHash('sha256').update(botToken).digest()
  const expected = Buffer.from(createHmac('sha256', secret).update(check).digest('hex'))
  const given = Buffer.from(hash)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false
  return now / 1000 - Number(rest.auth_date) < 86400
}
