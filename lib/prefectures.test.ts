import { describe, expect, it } from 'vitest'
import { prefectureNames, prefectureOf } from './prefectures'

describe('prefectureNames', () => {
  it('lists every prefecture once, north to south', () => {
    expect(prefectureNames).toHaveLength(47)
    expect(new Set(prefectureNames).size).toBe(47)
    expect(prefectureNames[0]).toBe('北海道')
    expect(prefectureNames.at(-1)).toBe('沖縄県')
  })
})

describe('prefectureOf', () => {
  it('reads the leading prefecture of a free-form place', () => {
    expect(prefectureOf('東京都 世田谷区')).toBe('東京都')
    expect(prefectureOf('  神奈川県横浜市')).toBe('神奈川県')
  })

  it('returns undefined when the place does not start with one', () => {
    expect(prefectureOf('世田谷区 東京都')).toBeUndefined()
    expect(prefectureOf('')).toBeUndefined()
  })
})
