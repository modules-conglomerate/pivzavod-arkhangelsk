import type { VercelRequest, VercelResponse } from '@vercel/node'
import { select, type BeerRow } from './_lib/db'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const all = await select<BeerRow>('beers', {}, { order: 'sort' })
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.json({ beers: all.filter((b) => b.published) })
}
