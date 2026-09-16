import { describe, expect, it } from 'vitest'
import { validateAgentProfile } from './agent'

const valid = {
  name: '高橋運送',
  kind: '法人',
  prefecture: '秋田県',
  vehicles: ['2tトラック', '4tトラック'],
  serviceAreas: ['秋田県', '山形県'],
  note: ' 週末対応可 ',
}

describe('validateAgentProfile', () => {
  it('accepts vehicles and service areas from the known lists', () => {
    expect(validateAgentProfile(valid)).toEqual({
      ok: true,
      value: { ...valid, note: '週末対応可' },
    })
  })

  it('requires at least one vehicle and area, and rejects unknown values', () => {
    const empty = validateAgentProfile({
      ...valid,
      vehicles: [],
      serviceAreas: [],
    })
    expect(empty.ok).toBe(false)
    if (!empty.ok)
      expect(Object.keys(empty.errors).sort()).toEqual([
        'serviceAreas',
        'vehicles',
      ])
    expect(validateAgentProfile({ ...valid, vehicles: ['自転車'] }).ok).toBe(
      false,
    )
    expect(
      validateAgentProfile({ ...valid, serviceAreas: ['どこか'] }).ok,
    ).toBe(false)
    expect(validateAgentProfile({ ...valid, prefecture: '不明' }).ok).toBe(
      false,
    )
  })
})
