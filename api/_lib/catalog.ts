import { beers as fallback } from '../../src/content/beers'
import { select, type BeerRow, type SignupRow } from './db'

/** Допустимые id сортов: опубликованные в базе, а если база пуста — статический каталог. */
export async function catalogIds(): Promise<Set<string>> {
  const rows = (await select<BeerRow>('beers')).filter((b) => b.published)
  return new Set((rows.length ? rows : fallback).map((b) => b.id))
}

export const takenPlaces = (signups: SignupRow[], slotId: string): number =>
  signups.filter((s) => s.slot_id === slotId && (s.status === 'registered' || s.status === 'attended')).reduce((n, s) => n + s.guests, 0)
