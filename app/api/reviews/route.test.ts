import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { getListing } from '@/lib/server/listings'
import { requestRental, updateRentalStatus } from '@/lib/server/rentals'
import { resetStore } from '@/lib/server/store'
import { demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(async () => {
  signInAs(demoUser)
  await resetStore()
  await seedLegacyRentalListings()
})

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

describe('POST /api/reviews', () => {
  it('creates a review for a completed rental and maps failures', async () => {
    const created = await requestRental(
      (await getListing('trc-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-02',
      },
    )
    const id = created.ok ? created.value.id : ''
    expect(
      (await post({ sourceKind: 'rental', sourceId: id, rating: 5 })).status,
    ).toBe(409)
    await updateRentalStatus(id, demoSeller, 'active')
    await updateRentalStatus(id, demoSeller, 'completed')
    expect(
      (await post({ sourceKind: 'rental', sourceId: id, rating: 9 })).status,
    ).toBe(400)
    const ok = await post({
      sourceKind: 'rental',
      sourceId: id,
      rating: 5,
      comment: '最高',
    })
    expect(ok.status).toBe(201)
    expect(await ok.json()).toMatchObject({ rating: 5, comment: '最高' })
    expect(
      (await post({ sourceKind: 'rental', sourceId: id, rating: 4 })).status,
    ).toBe(409)
    signInAs(demoSeller)
    expect(
      (await post({ sourceKind: 'rental', sourceId: id, rating: 4 })).status,
    ).toBe(403)
    expect(
      (await post({ sourceKind: 'rental', sourceId: 'nope', rating: 4 }))
        .status,
    ).toBe(404)
    signInAs(null)
    expect(
      (await post({ sourceKind: 'rental', sourceId: id, rating: 4 })).status,
    ).toBe(401)
  })
})
