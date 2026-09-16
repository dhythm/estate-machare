import { describe, expect, it } from 'vitest'
import { propertyImage } from './property-image'

describe('propertyImage', () => {
  it.each([
    ['apartment', 'apartment'],
    ['house', 'house'],
    ['land', 'land'],
    ['commercial', 'office'],
  ])('refreshes the saved %s demo illustration', (source, target) => {
    expect(propertyImage(`/properties/${source}.svg`)).toBe(
      `/properties/${target}.webp`,
    )
  })

  it.each([
    '/uploads/house.svg',
    'https://example.com/property.jpg',
    'data:image/jpeg;base64,example',
    '/properties/shop.webp',
  ])('preserves the original image %s', (source) => {
    expect(propertyImage(source)).toBe(source)
  })

  it('keeps a neutral fallback for missing images', () => {
    expect(propertyImage('')).toBe('/placeholder.svg')
    expect(propertyImage(undefined)).toBe('/placeholder.svg')
  })
})
