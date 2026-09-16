import { describe, expect, it, vi } from 'vitest'
import { getListing } from './listings'
import { buildModes } from './listing-detail'

vi.mock('server-only', () => ({}))

describe('listing detail business rules', () => {
  it('offers lease, purchase-option, and purchase for eligible equipment', async () => {
    const listing = (await getListing('trc-001'))!
    const modes = buildModes(listing)
    expect(modes.map((mode) => mode.id)).toEqual(['rent', 'purchaseOption', 'buy'])
    expect(modes[0].price).toBe('¥22,000/日')
    expect(modes[2].price).toBe('¥18,800,000')
    expect(modes[1].note).toBe(
      'レンタル料の50%（上限 ¥5,000,000）を購入価格に充当します。試してから決められるので、高額な買い物でも安心です。',
    )
    expect(JSON.parse(JSON.stringify(modes))).toEqual(modes)
  })

  it('only offers supported transactions', async () => {
    expect(
      buildModes((await getListing('drn-005'))!).map((mode) => mode.id),
    ).toEqual(['rent'])
    expect(
      buildModes((await getListing('trc-006'))!).map((mode) => mode.id),
    ).toEqual(['buy'])
  })
})
