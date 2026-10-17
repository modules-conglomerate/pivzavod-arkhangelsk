import { useState } from 'react'
import { BeerGrid, ContactCard, FeatureSplit, Hero, HistoryBlock, Identity, PageHead, Section, ShopGrid } from '../components/blocks'
import { familyLabels, features, type BeerFamily } from '../content/site'
import { useBeers } from '../lib/useBeers'

export function Home() {
  const beers = useBeers()
  return (
    <>
      <Hero />
      <Identity />
      <Section title="Наше пиво"><BeerGrid list={beers} /></Section>
      <FeatureSplit f={features.custom} />
      <FeatureSplit f={features.restaurant} flip />
      <FeatureSplit f={features.tours} />
      <FeatureSplit f={features.events} flip />
      <div className="pt-16"><HistoryBlock /></div>
      <Section title="Магазин и услуги"><ShopGrid /></Section>
    </>
  )
}

export const About = () => (
  <>
    <PageHead title="О нас" lead="История современности. Архангельский характер. Культура, вкус и люди." />
    <Identity />
    <HistoryBlock />
  </>
)

export function Beer() {
  const beers = useBeers()
  const [family, setFamily] = useState<BeerFamily | 'all'>('all')
  const list = beers.filter((b) => family === 'all' || b.family === family)
  return (
    <>
      <PageHead title="Наше пиво" lead="Варим на месте, из местной воды и отборного солода." />
      <section className="wrap py-12">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Фильтр сортов">
          {(Object.keys(familyLabels) as (BeerFamily | 'all')[]).map((k) => (
            <button key={k} aria-pressed={family === k} onClick={() => setFamily(k)}
              className={`border px-4 py-2 text-sm ${family === k ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/40'}`}>
              {familyLabels[k]}
            </button>
          ))}
        </div>
        <BeerGrid list={list} />
      </section>
      <FeatureSplit f={features.custom} />
    </>
  )
}

export const Restaurant = () => (<><PageHead title="Ресторан" lead="Гастрономия с характером." /><FeatureSplit f={features.restaurant} /></>)
export const Events = () => (<><PageHead title="События и пространства" /><FeatureSplit f={features.events} /></>)
export const Shop = () => (<><PageHead title="Магазин и услуги" lead="Вкус, который можно забрать с собой." /><section className="wrap py-12"><ShopGrid /></section></>)
export const Contacts = () => (<><PageHead title="Контакты" /><section className="wrap py-12"><ContactCard /></section></>)
export const NotFound = () => (<><PageHead title="Страница не найдена" lead="Проверьте адрес или вернитесь на главную." /></>)
