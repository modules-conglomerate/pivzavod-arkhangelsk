import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSession } from '../_lib/session'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  clearSession(res)
  res.status(204).end()
}
