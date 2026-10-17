import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { images } from '../content/images'

describe('изображения', () => {
  it('все файлы из srcSet лежат в public/images', () => {
    for (const [key, img] of Object.entries(images)) {
      const urls = [img.src, ...img.srcSet.split(',').map((s) => s.trim().split(' ')[0])]
      for (const u of urls) expect(existsSync(join(process.cwd(), 'public', u)), `${key}: ${u}`).toBe(true)
      expect(img.alt.length).toBeGreaterThan(10)
    }
  })
})
