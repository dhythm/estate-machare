import { describe, expect, it } from 'vitest'
import { validateAgentProfile } from './agent'

const valid = {
  name: '高橋不動産',
  kind: '宅建業者',
  prefecture: '東京都',
  handledCategories: ['マンション', '戸建'],
  serviceAreas: ['東京都', '神奈川県'],
  note: ' 週末対応可 ',
}

describe('validateAgentProfile', () => {
  it('accepts categories and service areas from the known lists', () => {
    expect(validateAgentProfile(valid)).toEqual({
      ok: true,
      value: { ...valid, note: '週末対応可' },
    })
  })

  it('requires at least one category and area, and rejects unknown values', () => {
    const empty = validateAgentProfile({
      ...valid,
      handledCategories: [],
      serviceAreas: [],
    })
    expect(empty.ok).toBe(false)
    if (!empty.ok)
      expect(Object.keys(empty.errors).sort()).toEqual([
        'handledCategories',
        'serviceAreas',
      ])
    expect(
      validateAgentProfile({ ...valid, handledCategories: ['別荘'] }).ok,
    ).toBe(false)
    expect(
      validateAgentProfile({ ...valid, serviceAreas: ['どこか'] }).ok,
    ).toBe(false)
    expect(validateAgentProfile({ ...valid, prefecture: '不明' }).ok).toBe(
      false,
    )
  })
})
