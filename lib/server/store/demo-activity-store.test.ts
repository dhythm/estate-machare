import { describe, expect, it, vi } from 'vitest'
import { createMemoryStore } from './memory'
import { createPgliteStore } from './pglite'
import type { Store } from './types'

vi.mock('server-only', () => ({}))

const stores: { name: string; store: Store }[] = [
  { name: 'memory', store: createMemoryStore({ demoActivity: true }) },
  ...(process.env.DATA_STORE === 'pglite'
    ? [
        {
          name: 'pglite',
          store: createPgliteStore({
            dataDir: 'memory://',
            demoActivity: true,
          }),
        },
      ]
    : []),
]

describe.each(stores)('$name store with demo activity', ({ store }) => {
  it('loads the activity rows and keeps the sample listings first', async () => {
    const listings = await store.listings.list()
    expect(listings.some((listing) => listing.id === 'trc-101')).toBe(true)
    expect(listings.some((listing) => listing.id === 'trc-001')).toBe(true)
    expect((await store.orders.list()).length).toBeGreaterThan(0)
    expect((await store.rentals.list()).length).toBeGreaterThan(0)
    expect((await store.reviews.list()).length).toBeGreaterThan(0)
    expect((await store.notifications.list()).length).toBeGreaterThan(0)
    expect(await store.transportJobs.list()).toEqual([])
    expect(await store.carrierProfiles.list()).toEqual([])
    expect(
      (await store.submissions.list()).every(
        (item) => item.kind === 'listingInquiry',
      ),
    ).toBe(true)
    const events = await store.dealEvents.list()
    expect(events[0]?.createdAt.localeCompare(events.at(-1)!.createdAt)).toBe(1)
    await store.reset()
    expect((await store.orders.list()).length).toBeGreaterThan(0)
    await store.close()
  }, 20_000)
})
