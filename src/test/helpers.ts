import { createHash, createHmac } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Переменные задаются до загрузки обработчиков API (они читают env при импорте).
process.env.TELEGRAM_BOT_TOKEN = '123:FLOW'
process.env.SESSION_SECRET = 'x'.repeat(40)
process.env.ADMIN_TELEGRAM_IDS = '1'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Out { status: number; body: any; cookie?: string; location?: string }

export async function call(h: Handler, o: { method?: string; query?: Record<string, string>; body?: unknown; cookie?: string }): Promise<Out> {
  const out: Out = { status: 200, body: undefined }
  const res = {
    status(c: number) { out.status = c; return res },
    json(b: unknown) { out.body = b; return res },
    end() { return res },
    setHeader(k: string, v: string) { if (k === 'Set-Cookie') out.cookie = v.split(';')[0] },
    redirect(c: number, l: string) { out.status = c; out.location = l },
  }
  await h({ method: o.method ?? 'GET', query: o.query ?? {}, body: o.body, headers: { cookie: o.cookie } } as unknown as VercelRequest, res as unknown as VercelResponse)
  return out
}

export function tgQuery(id: number, name: string): Record<string, string> {
  const d: Record<string, string> = { id: String(id), first_name: name, auth_date: String(Math.floor(Date.now() / 1000)) }
  const check = Object.keys(d).sort().map((k) => `${k}=${d[k]}`).join('\n')
  d.hash = createHmac('sha256', createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN!).digest()).update(check).digest('hex')
  return d
}
