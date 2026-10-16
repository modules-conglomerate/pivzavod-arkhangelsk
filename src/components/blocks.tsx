import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Skyline } from './Skyline'
import { beers, contacts, history, shopItems, type BeerItem, type Feature } from '../content/site'

export function PageHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="bg-plum text-ivory">
      <div className="wrap py-14">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-xl text-ivory/80">{lead}</p>}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <div className="relative flex min-h-[560px] items-end overflow-hidden bg-gradient-to-b from-[#1b1420] via-plum to-brick text-ivory">
      <Skyline className="absolute bottom-0 right-0 w-full max-w-4xl" />
      <p className="absolute right-6 top-8 text-right text-[11px] uppercase leading-7 tracking-[0.16em] text-gold">Старинные стены.<br />Новые вкусы.<br />С 1898</p>
      <div className="wrap relative w-full pb-16 pt-24">
        <h1 className="max-w-xl text-5xl uppercase md:text-7xl">История современности</h1>
        <p className="mt-5 max-w-md font-serif text-xl">Пивной ресторан и креативный кластер в историческом Архангельске</p>
        <Link to="/about" className="btn-ghost mt-7">Исследовать пространство</Link>
      </div>
    </div>
  )
}

export function Identity() {
  return (
    <section className="wrap py-16">
      <div className="grid border border-burgundy/20 bg-ivory md:grid-cols-[1.2fr_1fr]">
        <div className="p-8 md:p-10">
          <p className="font-serif text-5xl font-bold text-brick md:text-6xl">PIVZAVOD</p>
          <p className="mt-4 max-w-md">Пивзавод — историческое наследие Архангельска, современное пивоварение, гастрономия и пространство для людей, которые ценят культуру, вкус и атмосферу.</p>
        </div>
        <div className="border-t border-burgundy/20 p-8 md:border-l md:border-t-0 md:p-10">
          <h2 className="text-3xl">С 1898 года</h2>
          <p className="my-3">Здесь варили пиво для всего Севера. Сегодня мы продолжаем традиции, создавая новое культурное пространство в сердце Архангельска.</p>
          <Link to="/about" className="btn-dark">Читать историю</Link>
        </div>
      </div>
    </section>
  )
}

export function BeerCard({ b }: { b: BeerItem }) {
  return (
    <article className="border-b border-r border-burgundy/20 bg-ivory p-6">
      <div className="mb-4 flex h-28 items-end">
        <div className="relative h-24 w-14 overflow-hidden rounded-b-lg border-2 border-black/20">
          <div className="absolute inset-x-0 bottom-0 top-3" style={{ background: b.color }} />
          <div className="absolute inset-x-0 top-0 h-3 bg-white/70" />
        </div>
      </div>
      <h3 className="text-xl">{b.name}</h3>
      <p className="text-sm text-brick">{b.style}</p>
      <p className="my-2 text-xs text-charcoal/60">{b.abv} · {b.ibu} IBU</p>
      <p className="text-sm">{b.description}</p>
      {b.tasting_notes && <p className="mt-3 border-t border-burgundy/15 pt-2 text-xs"><b>Заметки сомелье.</b> {b.tasting_notes}</p>}
      {b.pairing && <p className="mt-1 text-xs"><b>К пиву.</b> {b.pairing}</p>}
    </article>
  )
}

export function BeerGrid({ list = beers }: { list?: BeerItem[] }) {
  return <div className="grid grid-cols-1 border-l border-t border-burgundy/20 sm:grid-cols-2 lg:grid-cols-4">{list.map((b) => <BeerCard key={b.id} b={b} />)}</div>
}

export function FeatureSplit({ f, flip = false }: { f: Feature; flip?: boolean }) {
  const dark = f.tone === 'dark'
  return (
    <section className={dark ? 'bg-burgundy text-ivory' : 'bg-paper'}>
      <div className="wrap grid gap-10 py-16 md:grid-cols-2 md:items-center">
        <div className={flip ? 'md:order-2' : ''}>
          <h2 className="text-3xl md:text-4xl">{f.title}</h2>
          <p className={`mt-2 ${dark ? 'text-gold' : 'text-brick'}`}>{f.subtitle}</p>
          <p className="mt-4 max-w-md">{f.text}</p>
          <ul className="my-6">
            {f.items.map((i) => <li key={i} className={`border-b py-2.5 ${dark ? 'border-white/15' : 'border-burgundy/15'}`}>{i}</li>)}
          </ul>
          <Link to={f.cta.to} className={dark ? 'btn-gold' : 'btn-dark'}>{f.cta.label}</Link>
        </div>
        <div className="grid aspect-[4/3] place-items-center border border-gold bg-gradient-to-br from-brick to-burgundy p-6 text-center font-serif text-2xl italic text-gold">{f.visual}</div>
      </div>
    </section>
  )
}

export function HistoryBlock() {
  return (
    <section className="wrap pb-16">
      <div className="grid bg-plum text-ivory md:grid-cols-2">
        <div className="p-8 md:p-11">
          <h2 className="text-3xl">История завода</h2>
          <p className="my-2 text-gold">Архив. Люди. Наследие.</p>
          <p>{history.text}</p>
        </div>
        <div className="grid place-items-center bg-charcoal p-8 text-center text-sm text-ivory/80">
          <div><b className="block font-serif text-xl text-ivory">{history.founder}</b>{history.role}</div>
        </div>
      </div>
    </section>
  )
}

export function ShopGrid() {
  return (
    <div className="grid grid-cols-2 border-l border-t border-burgundy/20 md:grid-cols-3">
      {shopItems.map(({ title, text, icon: Icon }) => (
        <div key={title} className="border-b border-r border-burgundy/20 bg-ivory p-6">
          <Icon className="mb-3 text-brick" size={28} />
          <b className="font-serif text-lg">{title}</b>
          <p className="text-sm text-charcoal/70">{text}</p>
        </div>
      ))}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wrap py-14">
      <h2 className="mb-6 border-b border-burgundy/20 pb-3 text-3xl">{title}</h2>
      {children}
    </section>
  )
}

export function ContactCard() {
  return (
    <div className="bg-burgundy p-8 text-ivory">
      <p>{contacts.address}<br />{contacts.phone}<br />{contacts.email}</p>
      <Link to="/booking" className="btn-gold mt-5">Забронировать</Link>
    </div>
  )
}
