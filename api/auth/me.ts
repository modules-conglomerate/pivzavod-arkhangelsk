import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUser } from '../_lib/db'
import { clearSession, readSession } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = readSession(req)
  const user = id ? await getUser(id) : null
  if (user?.status === 'blocked') { clearSession(res); return res.json({ user: null }) }
  res.json({ user })
}
