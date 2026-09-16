import { describe, expect, it } from 'vitest'
import {
  estimateDistanceKm,
  estimateTransportFee,
  prefectureOf,
  prefectures,
  transportBaseRates,
  transportMultiplier,
} from './transport-fee'

describe('prefectures', () => {
  it('lists all 47 with coordinates', () => {
    expect(prefectures).toHaveLength(47)
    expect(prefectures[0].name).toBe('北海道')
    expect(prefectures[46].name).toBe('沖縄県')
  })

  it('extracts the prefecture from a free-form place', () => {
    expect(prefectureOf('新潟県 長岡市')).toBe('新潟県')
    expect(prefectureOf('京都府京都市')).toBe('京都府')
    expect(prefectureOf('どこか')).toBeUndefined()
  })
})

describe('estimateDistanceKm', () => {
  it('returns road-adjusted distances and zero within a prefecture', () => {
    expect(estimateDistanceKm('新潟県', '新潟県')).toBe(0)
    const niigataToTokyo = estimateDistanceKm('新潟県', '東京都')
    expect(niigataToTokyo).toBeGreaterThan(300)
    expect(niigataToTokyo).toBeLessThan(400)
    expect(estimateDistanceKm('秋田県', '山形県')).toBeGreaterThan(100)
    expect(estimateDistanceKm('北海道', '沖縄県')).toBeGreaterThan(2000)
    expect(estimateDistanceKm('新潟県', '不明')).toBeUndefined()
  })
})

describe('estimateTransportFee', () => {
  it('multiplies the category base rate by the distance band', () => {
    expect(transportMultiplier(30)).toBe(1)
    expect(transportMultiplier(50)).toBe(1.3)
    expect(transportMultiplier(150)).toBe(1.8)
    expect(transportMultiplier(200)).toBe(2.5)
    expect(transportBaseRates['単身引越し']).toBe(30_000)
    expect(estimateTransportFee('単身引越し', 30)).toBe(30_000)
    expect(estimateTransportFee('ふたり暮らし', 120)).toBe(75_600)
    expect(estimateTransportFee('その他', 400)).toBe(50_000)
  })
})
