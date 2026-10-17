import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CalendarDays, Landmark, MapPin, Phone, Utensils, Wheat } from 'lucide-react'
import { Photo } from '../components/Photo'
import { contacts } from '../content/site'
import { images } from '../content/images'
import { ApiError } from '../lib/api'
import { plural, splitDuration } from '../lib/launch'
import { waitlistSchema, type WaitlistInput } from '../lib/schemas'
import { send } from '../lib/useResource'
import { useNow } from '../lib/useNow'

const perks = [
  { icon: Wheat, title: 'Авторское пиво', text: 'Классика и современные эксперименты' },
  { icon: Utensils, title: 'Гастрономия', text: 'Блюда северной кухни и локальные продукты' },
  { icon: Landmark, title: 'Ракурсы', text: 'История пивоварения и архитектуры завода' },
  { icon: CalendarDays, title: 'События', text: 'Выставки, дегустации, музыкальные вечера' },
]

export function Countdown({ at }: { at: number }) {
  const now = useNow(1000)
  const t = splitDuration(at - now)
  const cells: [number, [string, string, string]][] = [
    [t.days, ['день', 'дня', 'дней']], [t.hours, ['час', 'часа', 'часов']],
    [t.minutes, ['минута', 'минуты', 'минут']], [t.seconds, ['секунда', 'секунды', 'секунд']],
  ]
  return (
    <div role="timer" aria-label="До открытия" className="flex">
      {cells.map(([n, forms], i) => (
        <div key={i} className={`px-4 text-center first:pl-0 sm:px-6 ${i ? 'border-l border-gold/30' : ''}`}>
          <div className="font-serif text-4xl font-light tabular-nums text-ivory sm:text-6xl">{String(n).padStart(2, '0')}</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-gold">{plural(n, forms)}</div>
        </div>
      ))}
    </div>
  )
}

function WaitlistForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema), defaultValues: { contact: '', consent: false, website: '' },
  })
  const submit = handleSubmit(async (v) => {
    try { await send('POST', '/api/waitlist', v); setDone(true); setError('') } catch (e) { setError(e instanceof ApiError ? e.message : 'Не удалось отправить') }
  })
  if (done) return <p id="subscribe" role="status" className="max-w-md border border-gold/60 p-4 text-ivory">Спасибо! Вы узнаете об открытии первыми.</p>
  return (
    <form id="subscribe" onSubmit={submit} noValidate className="max-w-md">
      <label htmlFor="contact" className="sr-only">Почта или телефон</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="contact" autoComplete="email" placeholder="Почта или телефон"
          className="w-full border border-gold/60 bg-white/10 px-4 py-3 text-ivory placeholder:text-ivory/50" {...register('contact')} />
        <button className="btn-ghost shrink-0 py-3" disabled={isSubmitting}>Узнать первым <ArrowRight size={14} /></button>
      </div>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register('website')} />
      <label className="mt-3 flex gap-2 text-xs text-ivory/70"><input type="checkbox" {...register('consent')} />Согласен на обработку данных для рассылки об открытии</label>
      <p className="mt-1 min-h-4 text-xs text-gold" role="alert">{errors.contact?.message ?? errors.consent?.message ?? error}</p>
    </form>
  )
}

/** Заставка «Скоро открытие». at — момент открытия (мс) или null, если дата ещё не объявлена. */
export function Soon({ at }: { at: number | null }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Скоро открытие — ПИВЗАВОД, Архангельск'
    return () => { document.title = prev }
  }, [])
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120d10] text-ivory">
      <Photo image={images.restaurant} priority className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#120d10] via-[#120d10]/85 to-[#120d10]/40" />
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-gold/30">
          <div className="wrap flex h-20 items-center justify-between gap-4">
            <span className="font-serif text-2xl font-semibold tracking-[0.14em]">ПИВЗАВОД<span className="block text-[10px] font-normal tracking-[0.3em] text-gold">АРХАНГЕЛЬСК</span></span>
            <div className="flex items-center gap-5 text-sm">
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className="hidden items-center gap-2 sm:flex"><Phone size={14} />{contacts.phone}</a>
              <a href="#subscribe" className="btn-ghost">Следить за новостями</a>
            </div>
          </div>
        </header>

        <main className="wrap relative grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_1fr]">
          <p aria-hidden="true" className="absolute right-4 top-6 hidden -rotate-6 font-script text-3xl text-gold/90 lg:block">Вкус нашей истории</p>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold sm:text-sm">Пивной ресторан и креативный кластер</p>
            <h1 className="mt-4 font-serif text-6xl font-medium uppercase leading-[0.95] sm:text-8xl">Скоро открытие</h1>
            <p className="mt-6 max-w-lg font-serif text-xl text-ivory/90">История, вкус и люди. Мы готовим для вас особенное пространство в самом сердце Архангельска.</p>
            <div className="my-9">
              {at !== null ? <Countdown at={at} /> : <p className="font-serif text-2xl text-gold">Дату открытия объявим совсем скоро</p>}
            </div>
            <WaitlistForm />
          </div>
          <figure className="relative mx-auto w-full max-w-xl border border-gold/50 p-2">
            <Photo image={images.copper} sizes="(min-width:1024px) 520px, 100vw" className="h-auto w-full object-cover" />
          </figure>
        </main>

        <footer className="border-t border-gold/30 bg-black/30">
          <ul className="wrap grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="mt-1 shrink-0 text-gold" size={30} strokeWidth={1.3} />
                <span><b className="block text-xs uppercase tracking-widest">{title}</b><span className="text-sm text-ivory/70">{text}</span></span>
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm text-ivory/80"><MapPin size={16} className="shrink-0 text-gold" />{contacts.address}</li>
          </ul>
          <p className="wrap pb-4 text-right text-xs text-ivory/40"><Link to="/login" className="hover:text-gold">Вход для сотрудников</Link></p>
        </footer>
      </div>
    </div>
  )
}
