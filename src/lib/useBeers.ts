import { useEffect, useState } from 'react'
import { beers as fallback, type BeerItem } from '../content/site'
import { api } from './api'
import type { BeerRow } from '../types'

/** Каталог из базы; пока грузится или при ошибке — статический список из content/site.ts. */
export function useBeers(): BeerItem[] {
  const [list, setList] = useState<BeerItem[]>(fallback)
  useEffect(() => {
    api<{ beers: BeerRow[] }>('/api/beers')
      .then((r) => { if (r.beers.length) setList(r.beers.map((b) => ({ ...b, tasting_notes: b.tasting_notes ?? undefined, pairing: b.pairing ?? undefined }))) })
      .catch(() => undefined)
  }, [])
  return list
}
