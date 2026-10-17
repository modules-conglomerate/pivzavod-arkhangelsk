export interface Img { src: string; srcSet: string; width: number; height: number; alt: string }

// Файлы лежат в public/images: полный размер исходника и половинный для телефонов (WebP, q90).
const img = (name: string, w: number, h: number, half: number, alt: string): Img => ({
  src: `/images/${name}-${w}.webp`,
  srcSet: `/images/${name}-${half}.webp ${half}w, /images/${name}-${w}.webp ${w}w`,
  width: w,
  height: h,
  alt,
})

export const images = {
  hero: img('hero', 1672, 941, 836, 'Закат над кирпичным кварталом Пивзавода: заводская труба, корпуса и река'),
  restaurant: img('restaurant', 1672, 941, 836, 'Зал ресторана-пивоварни: кирпичные стены, медные варочные котлы и бар'),
  entrance: img('entrance', 892, 941, 446, 'Вход в исторический корпус Пивзавода на закате, терраса и заводская труба'),
  lineup: img('lineup', 1536, 405, 768, 'Четыре сорта Пивзавода в бокалах и бутылках: Северное, Архангельское, Беломорский, Кипрей'),
  copper: img('copper', 837, 520, 418, 'Бокал янтарного пива на фоне медных чанов пивоварни'),
} satisfies Record<string, Img>

export type ImageKey = keyof typeof images
