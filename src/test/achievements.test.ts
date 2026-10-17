import { buildPassport } from '../lib/achievements'

const cat = [{ id: 'a', family: 'light' }, { id: 'b', family: 'dark' }]

it('без визитов ничего не засчитывается', () => {
  const p = buildPassport([{ status: 'registered', set_beers: ['a'], focus_beer: 'a' }, { status: 'no_show', set_beers: ['b'], focus_beer: 'b' }], cat)
  expect(p.visits).toBe(0)
  expect(p.badges.some((b) => b.earned)).toBe(false)
})
it('считает визиты, сорта и циклы без дублей', () => {
  const p = buildPassport([
    { status: 'attended', set_beers: ['a'], focus_beer: 'a' },
    { status: 'attended', set_beers: ['a', 'b', 'zzz'], focus_beer: 'b' },
  ], cat)
  expect(p).toMatchObject({ visits: 2, tried: ['a', 'b'], cycles: ['a', 'b'] })
  expect(p.badges.find((b) => b.id === 'all')?.earned).toBe(true)
  expect(p.badges.find((b) => b.id === 'regular')).toMatchObject({ current: 2, target: 3, earned: false })
})
