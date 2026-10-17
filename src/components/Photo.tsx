import type { Img } from '../content/images'

interface Props {
  image: Img
  sizes?: string
  /** true — для первого экрана: грузится сразу и с высоким приоритетом. */
  priority?: boolean
  className?: string
}

export function Photo({ image, sizes = '100vw', priority = false, className }: Props) {
  return (
    <img
      src={image.src} srcSet={image.srcSet} sizes={sizes} width={image.width} height={image.height} alt={image.alt}
      loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : undefined} className={className}
    />
  )
}
