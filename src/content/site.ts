import { Beer, Gift, Shirt, Ticket, Truck, UtensilsCrossed, type LucideIcon } from 'lucide-react'

export const contacts = {
  address: 'Архангельск, ул. Суркова, 12',
  phone: '+7 (8182) 60-32-08',
  email: 'info@pivzavod.ru',
}

export const nav = [
  { to: '/about', label: 'О нас' },
  { to: '/beer', label: 'Пиво' },
  { to: '/restaurant', label: 'Ресторан' },
  { to: '/tours', label: 'Экскурсии' },
  { to: '/events', label: 'События' },
  { to: '/shop', label: 'Магазин' },
  { to: '/contacts', label: 'Контакты' },
]

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

export interface Feature {
  id: string
  title: string
  subtitle: string
  text: string
  items: string[]
  cta: { label: string; to: string }
  tone: 'dark' | 'light'
  visual: string
}
export const features: Record<'custom' | 'restaurant' | 'tours' | 'events', Feature> = {
  custom: {
    id: 'custom', title: 'Своё пиво', subtitle: 'Уникальный рецепт — ваш бренд', tone: 'dark',
    text: 'Создайте собственный сорт для события, компании или личной коллекции. Разработаем рецепт и авторскую этикетку, сварим партию от 100 литров.',
    items: ['Выбор стиля', 'Разработка рецепта', 'Дизайн этикетки', 'Производство'],
    cta: { label: 'Создать своё пиво', to: '/booking?kind=custom-beer' }, visual: 'Ваш сорт. Ваше имя на этикетке.',
  },
  restaurant: {
    id: 'restaurant', title: 'Гастрономия с характером', subtitle: 'Ресторан', tone: 'light',
    text: 'Авторская кухня, локальные продукты и идеальные сочетания с нашим пивом.',
    items: ['Сезонное меню', 'Блюда на компанию', 'Пивные сеты'],
    cta: { label: 'Забронировать столик', to: '/booking?kind=table' }, visual: 'Кирпич, дерево, огонь',
  },
  tours: {
    id: 'tours', title: 'Экскурсии и дегустации', subtitle: 'Погружение в процесс, история в деталях', tone: 'dark',
    text: 'Пройдите путь от зерна до кружки: цеха, медные чаны и четыре сорта в дегустационном сете.',
    items: ['Обзорная экскурсия по заводу', 'Дегустация 4 сортов', 'История пивоварения', 'Подарочный сертификат'],
    cta: { label: 'Забронировать', to: '/booking?kind=tour' }, visual: 'Медные чаны. Четыре сорта в ряд.',
  },
  events: {
    id: 'events', title: 'События и пространства', subtitle: 'Для важных событий и больших идей', tone: 'light',
    text: 'Исторический зал со сводчатыми окнами вмещает до 120 гостей. Свадьбы, корпоративы, лекции, выставки.',
    items: ['Частные мероприятия', 'Мастер-классы', 'Локальное искусство', 'Аренда пространства'],
    cta: { label: 'Забронировать событие', to: '/booking?kind=event' }, visual: 'Зал до 120 гостей',
  },
}

export interface ShopItem { title: string; text: string; icon: LucideIcon }
export const shopItems: ShopItem[] = [
  { title: 'Подарочные сертификаты', text: 'От 1 000 ₽', icon: Gift },
  { title: 'Мерч', text: 'Футболки, бокалы, кепки', icon: Shirt },
  { title: 'Экскурсии', text: 'Билеты и абонементы', icon: Ticket },
  { title: 'Частные ужины', text: 'Для компаний и пар', icon: UtensilsCrossed },
  { title: 'Кейтеринг', text: 'Для мероприятий', icon: Truck },
  { title: 'Пиво с вашим дизайном', text: 'Подарки и корпоративы', icon: Beer },
]

export const history = {
  founder: 'Сурков А. Ю.',
  role: 'Основатель завода (1898)',
  text: 'Пивзавод — это не только здание. Это люди, события и целая эпоха, которая формировала Архангельск.',
}
