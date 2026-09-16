import { describe, expect, it } from 'vitest'
import {
  readModerationQueueFilter,
  validateModerationInput,
} from './moderation'

describe('validateModerationInput', () => {
  const valid = {
    kind: 'listing',
    id: 'trc-001',
    status: 'approved',
    note: '掲載可',
  }

  it('accepts a decision and optional note', () => {
    expect(validateModerationInput(valid)).toEqual({
      ok: true,
      value: valid,
    })
    expect(validateModerationInput({ ...valid, note: '' })).toEqual({
      ok: true,
      value: { kind: 'listing', id: 'trc-001', status: 'approved' },
    })
  })

  it('rejects removed moving services', () => {
    expect(validateModerationInput({ ...valid, kind: 'transportJob' }).ok).toBe(
      false,
    )
  })

  it('rejects unknown kinds and decisions', () => {
    const result = validateModerationInput({
      kind: 'contact',
      id: '',
      status: 'maybe',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'id',
        'kind',
        'status',
      ])
    }
  })
})

describe('readModerationQueueFilter', () => {
  it('defaults to pending and rejects unknown values', () => {
    expect(readModerationQueueFilter(undefined)).toBe('pending')
    expect(readModerationQueueFilter('approved')).toBe('approved')
    expect(readModerationQueueFilter('unknown')).toBeUndefined()
  })
})
