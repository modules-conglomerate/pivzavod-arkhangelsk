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
  { to: '/rakurs', label: 'Ракурсы' },
  { to: '/events', label: 'События' },
  { to: '/shop', label: 'Магазин' },
  { to: '/contacts', label: 'Контакты' },
]

export { beers, familyLabels, type BeerFamily, type BeerItem } from './beers'

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
    id: 'tours', title: 'Ракурсы и дегустации', subtitle: 'Погружение в процесс, история в деталях', tone: 'dark',
    text: 'Выберите дату, соберите сет из четырёх сортов и один из них пройдите полным циклом: от зерна до бокала. Каждый ракурс отмечается в вашем дегустационном паспорте.',
    items: ['Обзорный ракурс по заводу', 'Сет из 4 сортов на ваш выбор', 'Полный цикл выбранного сорта', 'Достижения в паспорте гостя'],
    cta: { label: 'Записаться на ракурс', to: '/rakurs' }, visual: 'Медные чаны. Четыре сорта в ряд.',
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
  { title: 'Ракурсы', text: 'Билеты и абонементы', icon: Ticket },
  { title: 'Частные ужины', text: 'Для компаний и пар', icon: UtensilsCrossed },
  { title: 'Кейтеринг', text: 'Для мероприятий', icon: Truck },
  { title: 'Пиво с вашим дизайном', text: 'Подарки и корпоративы', icon: Beer },
]

export const history = {
  founder: 'Сурков А. Ю.',
  role: 'Основатель завода (1898)',
  text: 'Пивзавод — это не только здание. Это люди, события и целая эпоха, которая формировала Архангельск.',
}
