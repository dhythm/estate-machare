import { describe, expect, it, vi } from 'vitest'
import { getListing } from './listings'
import { buildModes } from './listing-detail'

vi.mock('server-only', () => ({}))

describe('listing detail business rules', () => {
  it('offers a lease, a purchase option, and a purchase where eligible', async () => {
    const listing = (await getListing('apt-001'))!
    const modes = buildModes(listing)
    expect(modes.map((mode) => mode.id)).toEqual([
      'rent',
      'purchaseOption',
      'buy',
    ])
    expect(modes[0].price).toBe('¥268,000/月')
    expect(modes[2].price).toBe('¥88,000,000')
    expect(modes[1].note).toBe(
      '賃料の50%（上限 ¥5,000,000）を購入価格に充当します。住んでから決められるので、高額な買い物でも安心です。',
    )
    expect(JSON.parse(JSON.stringify(modes))).toEqual(modes)
  })

  it('only offers supported transactions', async () => {
    expect(
      buildModes((await getListing('cml-005'))!).map((mode) => mode.id),
    ).toEqual(['rent'])
    expect(
      buildModes((await getListing('lnd-004'))!).map((mode) => mode.id),
    ).toEqual(['buy'])
  })
})
