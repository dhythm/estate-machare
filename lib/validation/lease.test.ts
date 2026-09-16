import { describe, expect, it } from 'vitest'
import { validateLeaseRequest, validateLeaseStatus } from './lease'

describe('validateLeaseRequest', () => {
  it('requires two dates', () => {
    expect(
      validateLeaseRequest({ startDate: '2026-10-01', endDate: '2026-10-07' }),
    ).toEqual({
      ok: true,
      value: { startDate: '2026-10-01', endDate: '2026-10-07' },
    })
    expect(validateLeaseRequest({ startDate: '', endDate: 'x' }).ok).toBe(
      false,
    )
  })
})

describe('validateLeaseStatus', () => {
  it('accepts only known statuses', () => {
    expect(validateLeaseStatus({ status: 'active' })).toEqual({
      ok: true,
      value: { status: 'active' },
    })
    expect(validateLeaseStatus({ status: 'paid' }).ok).toBe(false)
  })
})
