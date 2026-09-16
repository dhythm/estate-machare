import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { resetStore } from '@/lib/server/store'
import { demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

const context = (id: string) => ({ params: Promise.resolve({ id }) })
const week = { startDate: '2026-10-01', endDate: '2026-10-07' }

beforeEach(async () => {
  signInAs(demoUser)
  await resetStore()
  await seedLegacyRentalListings()
})

const post = (id: string, body: unknown) =>
  POST(
    new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    context(id),
  )

describe('/api/listings/[id]/rentals', () => {
  it('creates a request and publishes the booked range', async () => {
    const created = await post('trc-001', week)
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({
      status: 'requested',
      days: 7,
      rentTotal: 154_000,
    })
    signInAs(null)
    const ranges = await GET(
      new Request('http://localhost'),
      context('trc-001'),
    )
    expect(ranges.status).toBe(200)
    expect(await ranges.json()).toEqual({ booked: [week] })
  })

  it('maps failures to status codes', async () => {
    await post('trc-001', week)
    expect((await post('trc-001', week)).status).toBe(409)
    expect(
      (await post('trc-001', { startDate: '', endDate: '2026-10-07' })).status,
    ).toBe(400)
    expect(
      (
        await post('trc-001', {
          startDate: '2026-10-20',
          endDate: '2026-10-10',
        })
      ).status,
    ).toBe(400)
    expect((await post('trc-006', week)).status).toBe(409)
    expect((await post('missing', week)).status).toBe(404)
    signInAs(demoSeller)
    expect((await post('trc-001', week)).status).toBe(403)
    signInAs(null)
    expect((await post('trc-001', week)).status).toBe(401)
    expect(
      (await GET(new Request('http://localhost'), context('missing'))).status,
    ).toBe(404)
  })
})
