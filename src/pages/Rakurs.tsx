import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PageHead } from '../components/blocks'
import { images } from '../content/images'
import { cycleStages, rakursSteps } from '../content/rakurs'
import { ApiError } from '../lib/api'
import { buildPassport } from '../lib/achievements'
import { MAX_SET, rakursSignupSchema } from '../lib/schemas'
import { send, useResource } from '../lib/useResource'
import { useBeers } from '../lib/useBeers'
import type { MySignup, RakursSlot } from '../types'

export const when = (s: string) =>
  new Date(s).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/** Расписание ракурсов и описание полного цикла. */
export function Rakurs() {
  const { data, error } = useResource<{ slots: RakursSlot[] }>('/api/rakurs')
  return (
    <>
      <PageHead title="Ракурсы и дегустации" lead="Заводской ракурс: пройдите путь пива от зерна до бокала и соберите свой дегустационный сет." image={images.copper} />
      <section className="wrap py-10">
        <h2 className="mb-5 text-3xl">Ближайшие даты</h2>
        {error && <p className="err" role="alert">{error}</p>}
        {data?.slots.length === 0 && <p>Новые даты появятся совсем скоро.</p>}
        <ul className="grid gap-3 md:grid-cols-2">
          {data?.slots.map((s) => (
            <li key={s.id} className="border border-burgundy/20 bg-ivory p-5">
              <h3 className="text-xl">{s.title}</h3>
              <p className="mt-1">{when(s.starts_at)}</p>
              <p className="text-sm text-charcoal/70">
                {s.lead ? `Ведёт: ${s.lead} · ` : ''}{s.price_rub ? `${s.price_rub} ₽ с гостя` : 'бесплатно'} · {s.free > 0 ? `свободно мест: ${s.free}` : 'мест нет'}
              </p>
              {s.free > 0 ? <Link to={`/rakurs/${s.id}`} className="btn-dark mt-4">Записаться</Link> : <p className="mt-4 text-sm text-brick">Запись закрыта</p>}
            </li>
          ))}
        </ul>
      </section>
      <section className="bg-burgundy py-14 text-ivory">
        <div className="wrap">
          <h2 className="text-3xl">Полный цикл за один ракурс</h2>
          <p className="mt-2 max-w-xl text-ivory/80">Выберите сорт при записи, и мы пройдём его путь по цехам от зерна до бокала.</p>
          <ol className="mt-8 grid gap-0 border-l border-t border-white/20 sm:grid-cols-2 lg:grid-cols-3">
            {cycleStages.map((c, i) => (
              <li key={c.title} className="border-b border-r border-white/20 p-5">
                <span className="font-serif text-3xl text-gold">{i + 1}</span>
                <b className="block font-serif text-lg">{c.title}</b>
                <span className="text-sm text-ivory/80">{c.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="wrap py-14">
        <h2 className="mb-6 text-3xl">Как это работает</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {rakursSteps.map((s, i) => (
            <li key={s.title} className="border border-burgundy/20 bg-ivory p-5">
              <span className="font-serif text-2xl text-brick">{i + 1}.</span> <b>{s.title}</b>
              <p className="mt-1 text-sm">{s.text}</p>
            </li>
          ))}
        </ol>
        <Link to="/passport" className="btn-dark mt-8">Мой дегустационный паспорт</Link>
      </section>
    </>
  )
}

/** Запись на ракурс со сборкой дегустационного сета. */
export function RakursSignupPage() {
  const { id = '' } = useParams()
  const go = useNavigate()
  const beers = useBeers()
  const { data } = useResource<{ slots: RakursSlot[] }>('/api/rakurs')
  const slot = data?.slots.find((s) => s.id === id)
  const [set, setSet] = useState<string[]>([])
  const [focus, setFocus] = useState('')
  const [guests, setGuests] = useState(1)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (beer: string) => {
    if (set.includes(beer)) {
      const next = set.filter((b) => b !== beer)
      setSet(next)
      if (focus === beer) setFocus(next[0] ?? '')
    } else if (set.length < MAX_SET) {
      setSet([...set, beer])
      if (!focus) setFocus(beer)
    }
  }
  const name = (b: string) => beers.find((x) => x.id === b)?.name ?? b

  const submit = async () => {
    const parsed = rakursSignupSchema.safeParse({ slotId: id, setBeers: set, focusBeer: focus, guests, comment: comment || undefined })
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      await send('POST', '/api/rakurs', parsed.data)
      go('/passport')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось записаться')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHead title="Запись на ракурс" lead={slot ? `${slot.title} · ${when(slot.starts_at)}` : 'Загрузка…'} />
      <section className="wrap max-w-3xl py-10">
        <h2 className="text-2xl">1. Соберите сет</h2>
        <p className="mb-4 text-sm text-charcoal/70">До {MAX_SET} сортов. Выбрано: {set.length} из {MAX_SET}.</p>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Сорта для сета">
          {beers.map((b) => {
            const on = set.includes(b.id)
            return (
              <button key={b.id} type="button" aria-pressed={on} onClick={() => toggle(b.id)}
                className={`flex items-center gap-3 border p-3 text-left ${on ? 'border-gold bg-burgundy text-ivory' : 'border-burgundy/30 bg-ivory'}`}>
                <span className="h-10 w-7 shrink-0 border border-black/20" style={{ background: b.color }} />
                <span className="grow"><b className="font-serif">{b.name}</b><br /><span className="text-xs opacity-80">{b.style} · {b.abv}</span></span>
                {on && <Check size={18} />}
              </button>
            )
          })}
        </div>

        <h2 className="mt-10 text-2xl">2. Какой сорт посмотреть полным циклом</h2>
        {set.length === 0 ? <p className="mt-2 text-sm text-charcoal/70">Сначала выберите сорта в сете.</p> : (
          <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Сорт для полного цикла">
            {set.map((b) => (
              <label key={b} className="flex items-center gap-3 border border-burgundy/30 bg-ivory p-3">
                <input type="radio" name="focus" checked={focus === b} onChange={() => setFocus(b)} />
                Путь сорта «{name(b)}» от зерна до бокала
              </label>
            ))}
          </div>
        )}

        <h2 className="mt-10 text-2xl">3. Гости</h2>
        <label className="label" htmlFor="guests">Сколько человек</label>
        <input id="guests" type="number" min={1} max={10} className="field w-28" value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
        {slot && <p className="mt-1 text-sm text-charcoal/70">Свободно мест: {slot.free}</p>}
        <label className="label" htmlFor="comment">Пожелания</label>
        <textarea id="comment" rows={2} className="field" value={comment} onChange={(e) => setComment(e.target.value)} />
        <p className="err" role="alert">{error}</p>
        <button className="btn-dark mt-3" disabled={busy || !slot} onClick={() => void submit()}>Записаться</button>
      </section>
    </>
  )
}

/** Дегустационный паспорт: визиты, попробованные сорта, достижения. */
export function Passport() {
  const { data, error, reload } = useResource<{ signups: MySignup[] }>('/api/rakurs?mine=1')
  const beers = useBeers()
  const signups = data?.signups ?? []
  const p = useMemo(() => buildPassport(signups, beers), [signups, beers])
  const name = (b: string) => beers.find((x) => x.id === b)?.name ?? b
  const upcoming = signups.filter((s) => s.status === 'registered' && new Date(s.slot.starts_at) > new Date())
  const history = signups.filter((s) => s.status === 'attended')
  return (
    <>
      <PageHead title="Дегустационный паспорт" lead="Ваши ракурсы, сорта и достижения в Пивзаводе." />
      <section className="wrap py-10">
        {error && <p className="err" role="alert">{error}</p>}
        <div className="grid grid-cols-3 border border-burgundy/20 bg-ivory text-center">
          {[[p.visits, 'ракурсов посещено'], [`${p.tried.length}/${beers.length}`, 'сортов попробовано'], [p.cycles.length, 'полных циклов']].map(([n, l]) => (
            <div key={String(l)} className="border-r border-burgundy/20 p-5 last:border-r-0">
              <div className="font-serif text-4xl text-brick">{n}</div><div className="text-xs">{l}</div>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-12 text-2xl">Сорта</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {beers.map((b) => {
            const got = p.tried.includes(b.id)
            return (
              <li key={b.id} className={`border p-4 text-center ${got ? 'border-gold bg-ivory' : 'border-burgundy/20 opacity-50'}`}>
                <span className="mx-auto mb-2 block h-12 w-8 border border-black/20" style={{ background: got ? b.color : '#bbb' }} />
                <b className="font-serif">{b.name}</b>
                <div className="text-xs">{got ? (p.cycles.includes(b.id) ? 'пробовали · полный цикл' : 'пробовали') : 'ещё не пробовали'}</div>
              </li>
            )
          })}
        </ul>

        <h2 className="mb-4 mt-12 text-2xl">Достижения</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {p.badges.map((b) => (
            <li key={b.id} className={`border p-4 ${b.earned ? 'border-gold bg-burgundy text-ivory' : 'border-burgundy/20 bg-ivory'}`}>
              <b className="font-serif text-lg">{b.earned ? '★ ' : ''}{b.title}</b>
              <p className="text-sm opacity-80">{b.description}</p>
              <div className="mt-2 h-1.5 bg-black/15" role="progressbar" aria-valuenow={b.current} aria-valuemax={b.target} aria-label={b.title}>
                <div className="h-full bg-gold" style={{ width: `${(b.current / b.target) * 100}%` }} />
              </div>
              <span className="text-xs">{b.current} из {b.target}</span>
            </li>
          ))}
        </ul>

        <h2 className="mb-4 mt-12 text-2xl">Предстоящие</h2>
        {upcoming.length === 0 ? <p>Записей нет. <Link to="/rakurs" className="underline">Выбрать ракурс</Link></p> : (
          <ul className="grid gap-3">
            {upcoming.map((s) => (
              <li key={s.id} className="border border-burgundy/20 bg-ivory p-4">
                <b>{s.slot.title}</b> · {when(s.slot.starts_at)} · гостей: {s.guests}
                <p className="text-sm">Сет: {s.set_beers.map(name).join(', ')} · полный цикл: {name(s.focus_beer)}</p>
                <button className="btn-dark mt-2" onClick={() => void send('DELETE', `/api/rakurs?id=${s.id}`).then(reload)}>Отменить запись</button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-4 mt-12 text-2xl">История</h2>
        {history.length === 0 ? <p>Первый штамп появится после ракурса.</p> : (
          <ul className="grid gap-3">
            {history.map((s) => (
              <li key={s.id} className="border border-burgundy/20 bg-ivory p-4">
                <b>{s.slot.title}</b> · {new Date(s.slot.starts_at).toLocaleDateString('ru-RU')}
                <p className="text-sm">Пробовали: {s.set_beers.map(name).join(', ')} · полный цикл: {name(s.focus_beer)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
