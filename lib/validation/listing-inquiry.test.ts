import { describe, expect, it } from 'vitest'
import { validateListingInquiry } from './listing-inquiry'

const valid = {
  mode: 'rent',
  name: '山田 太郎',
  email: 'taro@example.com',
  preferredDate: '2026-10-01',
  message: '10月上旬に1週間ほど借りたいです。',
}

describe('validateListingInquiry', () => {
  it('accepts a lease inquiry', () => {
    const result = validateListingInquiry(valid)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.mode).toBe('rent')
  })

  it('allows a question without a date', () => {
    const result = validateListingInquiry({
      ...valid,
      mode: 'question',
      preferredDate: '',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.preferredDate).toBeUndefined()
  })

  it('rejects unknown modes, bad emails, and empty messages', () => {
    const result = validateListingInquiry({
      ...valid,
      mode: 'steal',
      email: 'x',
      message: ' ',
    })
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual([
        'email',
        'message',
        'mode',
      ])
  })
})
