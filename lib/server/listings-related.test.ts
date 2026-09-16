import { describe, expect, it, vi } from 'vitest'
import { getListing, getRelatedListings } from './listings'

vi.mock('server-only', () => ({}))

describe('getRelatedListings', () => {
  it('returns other listings in the same category, excluding itself', async () => {
    const listing = (await getListing('apt-001'))!
    const related = await getRelatedListings(listing, 3)
    expect(related).toHaveLength(3)
    expect(related.map((item) => item.id)).not.toContain('apt-001')
    expect(related.every((item) => item.category === 'マンション')).toBe(true)
  })
})
