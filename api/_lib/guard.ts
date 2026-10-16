import type { VercelRequest, VercelResponse } from '@vercel/node'
import { can, type Permission } from '../../src/lib/roles'
import { getUser, type UserRow } from './db'
import { readSession } from './session'

/** Возвращает пользователя или сам отвечает 401/403 и возвращает null. Права проверяются только здесь, на сервере. */
export async function authorize(req: VercelRequest, res: VercelResponse, perm?: Permission): Promise<UserRow | null> {
  const id = readSession(req)
  if (!id) { res.status(401).json({ error: 'Нужно войти через Telegram' }); return null }
  const user = await getUser(id)
  if (!user || user.status === 'blocked') { res.status(403).json({ error: 'Доступ закрыт' }); return null }
  if (perm && !can(user.role, perm)) { res.status(403).json({ error: 'Недостаточно прав' }); return null }
  return user
}
