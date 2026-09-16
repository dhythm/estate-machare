const refreshedImage: Record<string, string> = {
  '/properties/apartment.svg': '/properties/apartment.webp',
  '/properties/house.svg': '/properties/house.webp',
  '/properties/land.svg': '/properties/land.webp',
  '/properties/commercial.svg': '/properties/office.webp',
}

/** Refresh saved demo artwork without changing uploaded or external images. */
export function propertyImage(source?: string): string {
  if (!source) return '/placeholder.svg'
  return refreshedImage[source] ?? source
}
