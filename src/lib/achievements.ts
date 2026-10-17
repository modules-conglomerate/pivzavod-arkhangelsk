export interface PassportSignup { status: string; set_beers: string[]; focus_beer: string }
export interface Badge { id: string; title: string; description: string; current: number; target: number; earned: boolean }
export interface Passport { visits: number; tried: string[]; cycles: string[]; badges: Badge[] }

/**
 * Паспорт гостя. Считается только по ракурсам, где сомелье отметил «пришёл»:
 * визиты = число отмеченных ракурсов, сорта = всё, что было в сетах этих ракурсов,
 * полный цикл = сорта, выбранные гостем для просмотра пути от зерна до бокала.
 */
export function buildPassport(signups: PassportSignup[], catalog: { id: string; family: string }[]): Passport {
  const done = signups.filter((s) => s.status === 'attended')
  const ids = new Set(catalog.map((b) => b.id))
  const tried = [...new Set(done.flatMap((s) => s.set_beers))].filter((id) => ids.has(id))
  const cycles = [...new Set(done.map((s) => s.focus_beer))].filter((id) => ids.has(id))
  const visits = done.length
  const biggestSet = Math.max(0, ...done.map((s) => new Set(s.set_beers).size))
  const darkTried = catalog.filter((b) => b.family === 'dark' && tried.includes(b.id)).length

  const mk = (id: string, title: string, description: string, current: number, target: number): Badge => ({
    id, title, description, current: Math.min(current, target), target, earned: current >= target,
  })
  const badges = [
    mk('first', 'Первый ракурс', 'Побывать на первом ракурсе', visits, 1),
    mk('regular', 'Завсегдатай', 'Побывать на трёх ракурсах', visits, 3),
    mk('keeper', 'Хранитель завода', 'Побывать на пяти ракурсах', visits, 5),
    mk('ten', 'Десять ракурсов', 'Побывать на десяти ракурсах', visits, 10),
    mk('quartet', 'Полная четвёрка', 'Попробовать четыре сорта за один ракурс', biggestSet, 4),
    mk('cycle', 'Путь от зерна', 'Увидеть полный цикл любого сорта', cycles.length, 1),
    mk('cycles3', 'Три пути', 'Увидеть полный цикл трёх разных сортов', cycles.length, 3),
    mk('dark', 'Тёмная сторона', 'Попробовать тёмное пиво', darkTried, 1),
    mk('all', 'Все сорта', 'Попробовать каждый сорт каталога', tried.length, Math.max(1, catalog.length)),
  ]
  return { visits, tried, cycles, badges }
}
