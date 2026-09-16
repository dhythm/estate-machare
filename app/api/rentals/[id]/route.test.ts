import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from './route'
import { getListing } from '@/lib/server/listings'
import { requestRental } from '@/lib/server/rentals'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(async () => {
  signInAs(demoSeller)
  await resetStore()
  await seedLegacyRentalListings()
})

const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )

describe('PATCH /api/rentals/[id]', () => {
  it('applies transitions with the right status codes', async () => {
    const listing = (await getListing('trc-001'))!
    const created = await requestRental(listing, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    })
    const id = created.ok ? created.value.id : ''
    expect((await patch(id, { status: 'paid' })).status).toBe(400)
    expect((await patch(id, { status: 'completed' })).status).toBe(409)
    const active = await patch(id, { status: 'active' })
    expect(active.status).toBe(200)
    expect((await active.json()).status).toBe('active')
    signInAs(demoUser)
    const converted = await patch(id, { status: 'converted' })
    expect(converted.status).toBe(200)
    expect((await converted.json()).purchasePrice).toBe(18_723_000)
    signInAs(demoAdmin)
    expect((await patch(id, { status: 'completed' })).status).toBe(409)
    signInAs(null)
    expect((await patch(id, { status: 'completed' })).status).toBe(401)
    signInAs(demoSeller)
    expect((await patch('missing', { status: 'active' })).status).toBe(404)
  })
})
