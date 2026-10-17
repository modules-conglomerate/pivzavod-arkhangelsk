export type BeerFamily = 'light' | 'red' | 'dark'
export interface BeerItem {
  id: string
  name: string
  style: string
  family: BeerFamily
  abv: string
  ibu: number
  color: string
  description: string
  tasting_notes?: string
  pairing?: string
}
export const familyLabels: Record<BeerFamily | 'all', string> = {
  all: 'Все сорта',
  light: 'Светлые',
  red: 'Красные',
  dark: 'Тёмные',
}
export const beers: BeerItem[] = [
  { id: 'severnoe', name: 'Северное', style: 'Светлый эль', family: 'light', abv: '5,2%', ibu: 18, color: '#E8A93A', description: 'Лёгкий, освежающий вкус с нотами хлеба и цитрусов.' },
  { id: 'arhangelskoe', name: 'Архангельское', style: 'Красный эль', family: 'red', abv: '5,8%', ibu: 25, color: '#9B3B20', description: 'Карамельный солод, лёгкая горчинка, аромат ягод.' },
  { id: 'belomorskiy', name: 'Беломорский', style: 'Стаут', family: 'dark', abv: '6,5%', ibu: 40, color: '#2A1812', description: 'Глубокий вкус с нотами шоколада, кофе и дыма.' },
  { id: 'kiprey', name: 'Кипрей', style: 'IPA', family: 'light', abv: '6,8%', ibu: 55, color: '#D9892B', description: 'Яркий хмелевой аромат, цитрусовые и цветочные ноты.' },
]
