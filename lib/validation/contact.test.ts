import { describe, expect, it } from 'vitest'
import { validateContact } from './contact'

describe('validateContact', () => {
  it('accepts a message', () => {
    expect(
      validateContact({
        name: '鈴木',
        email: 'suzuki@example.com',
        topic: '取引について',
        message: '買取オプションの充当額について知りたいです。',
      }).ok,
    ).toBe(true)
  })

  it('rejects overly long messages and unknown topics', () => {
    const result = validateContact({
      name: '鈴木',
      email: 'suzuki@example.com',
      topic: 'その他の何か',
      message: 'あ'.repeat(2001),
    })
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(['message', 'topic'])
  })
})
