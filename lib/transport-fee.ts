/** Transport pricing shared by the listing page, the job form, and the pricing page. */

export type Prefecture = { name: string; lat: number; lng: number }

/** Prefectural capitals, north to south. */
export const prefectures: Prefecture[] = [
  { name: '北海道', lat: 43.064, lng: 141.347 },
  { name: '青森県', lat: 40.825, lng: 140.74 },
  { name: '岩手県', lat: 39.704, lng: 141.153 },
  { name: '宮城県', lat: 38.269, lng: 140.872 },
  { name: '秋田県', lat: 39.719, lng: 140.103 },
  { name: '山形県', lat: 38.24, lng: 140.364 },
  { name: '福島県', lat: 37.75, lng: 140.468 },
  { name: '茨城県', lat: 36.342, lng: 140.447 },
  { name: '栃木県', lat: 36.566, lng: 139.884 },
  { name: '群馬県', lat: 36.391, lng: 139.061 },
  { name: '埼玉県', lat: 35.857, lng: 139.649 },
  { name: '千葉県', lat: 35.605, lng: 140.123 },
  { name: '東京都', lat: 35.69, lng: 139.692 },
  { name: '神奈川県', lat: 35.448, lng: 139.643 },
  { name: '新潟県', lat: 37.902, lng: 139.023 },
  { name: '富山県', lat: 36.695, lng: 137.211 },
  { name: '石川県', lat: 36.595, lng: 136.626 },
  { name: '福井県', lat: 36.065, lng: 136.222 },
  { name: '山梨県', lat: 35.664, lng: 138.568 },
  { name: '長野県', lat: 36.651, lng: 138.181 },
  { name: '岐阜県', lat: 35.391, lng: 136.722 },
  { name: '静岡県', lat: 34.977, lng: 138.383 },
  { name: '愛知県', lat: 35.18, lng: 136.907 },
  { name: '三重県', lat: 34.73, lng: 136.509 },
  { name: '滋賀県', lat: 35.005, lng: 135.869 },
  { name: '京都府', lat: 35.021, lng: 135.756 },
  { name: '大阪府', lat: 34.686, lng: 135.52 },
  { name: '兵庫県', lat: 34.691, lng: 135.183 },
  { name: '奈良県', lat: 34.685, lng: 135.833 },
  { name: '和歌山県', lat: 34.226, lng: 135.168 },
  { name: '鳥取県', lat: 35.504, lng: 134.238 },
  { name: '島根県', lat: 35.472, lng: 133.051 },
  { name: '岡山県', lat: 34.662, lng: 133.935 },
  { name: '広島県', lat: 34.396, lng: 132.46 },
  { name: '山口県', lat: 34.186, lng: 131.471 },
  { name: '徳島県', lat: 34.066, lng: 134.559 },
  { name: '香川県', lat: 34.34, lng: 134.043 },
  { name: '愛媛県', lat: 33.842, lng: 132.766 },
  { name: '高知県', lat: 33.56, lng: 133.531 },
  { name: '福岡県', lat: 33.607, lng: 130.418 },
  { name: '佐賀県', lat: 33.249, lng: 130.3 },
  { name: '長崎県', lat: 32.745, lng: 129.874 },
  { name: '熊本県', lat: 32.79, lng: 130.742 },
  { name: '大分県', lat: 33.238, lng: 131.613 },
  { name: '宮崎県', lat: 31.911, lng: 131.424 },
  { name: '鹿児島県', lat: 31.56, lng: 130.558 },
  { name: '沖縄県', lat: 26.212, lng: 127.681 },
]

export const prefectureNames = prefectures.map((prefecture) => prefecture.name)

/** Leading prefecture in a free-form place such as "新潟県 長岡市". */
export function prefectureOf(place: string): string | undefined {
  return prefectureNames.find((name) => place.trim().startsWith(name))
}

const earthRadiusKm = 6371
/** Roads are longer than the straight line; a flat factor is enough for an estimate. */
const roadFactor = 1.3

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Road-adjusted distance between two prefectural capitals, in whole km. */
export function estimateDistanceKm(
  from: string,
  to: string,
): number | undefined {
  const a = prefectures.find((prefecture) => prefecture.name === from)
  const b = prefectures.find((prefecture) => prefecture.name === to)
  if (!a || !b) return undefined
  if (a === b) return 0
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2
  const straight = 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
  return Math.round(straight * roadFactor)
}

export const transportBaseRates: Record<string, number> = {
  単身引越し: 30_000,
  ふたり暮らし: 42_000,
  家族の引越し: 60_000,
  家具配送: 6_000,
  小口配送: 4_000,
}

export const transportDefaultRate = 20_000

export const distanceBands = [
  { upTo: 50, rate: 1.0, label: '〜50km' },
  { upTo: 100, rate: 1.3, label: '50〜100km' },
  { upTo: 200, rate: 1.8, label: '100〜200km' },
  { upTo: Infinity, rate: 2.5, label: '200km〜' },
] as const

export function transportMultiplier(distanceKm: number): number {
  return (
    distanceBands.find((band) => distanceKm < band.upTo)?.rate ??
    distanceBands[distanceBands.length - 1].rate
  )
}

export function transportBaseRate(category: string): number {
  return transportBaseRates[category] ?? transportDefaultRate
}

/** Base rate for the category times the distance band, rounded to 100 yen. */
export function estimateTransportFee(
  category: string,
  distanceKm: number,
): number {
  return (
    Math.round(
      (transportBaseRate(category) * transportMultiplier(distanceKm)) / 100,
    ) * 100
  )
}
