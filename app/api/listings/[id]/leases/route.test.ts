import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { resetStore } from '@/lib/server/store'
import { demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

const context = (id: string) => ({ params: Promise.resolve({ id }) })
const term = { startDate: '2026-10-01', endDate: '2027-09-30' }

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const post = (id: string, body: unknown) =>
  POST(
    new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    context(id),
  )

describe('/api/listings/[id]/leases', () => {
  it('creates a request and publishes the booked range', async () => {
    const created = await post('apt-001', term)
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({
      status: 'requested',
      months: 12,
      rentTotal: 3_216_000,
      deposit: 536_000,
      keyMoney: 268_000,
      initialCost: 1_340_000,
    })
    signInAs(null)
    const ranges = await GET(
      new Request('http://localhost'),
      context('apt-001'),
    )
    expect(ranges.status).toBe(200)
    expect(await ranges.json()).toEqual({ booked: [term] })
  })

  it('maps failures to status codes', async () => {
    await post('apt-001', term)
    expect((await post('apt-001', term)).status).toBe(409)
    expect(
      (await post('apt-001', { startDate: '', endDate: '2027-09-30' })).status,
    ).toBe(400)
    expect(
      (
        await post('apt-001', {
          startDate: '2027-10-20',
          endDate: '2026-10-10',
        })
      ).status,
    ).toBe(400)
    expect((await post('lnd-004', term)).status).toBe(409)
    expect((await post('missing', term)).status).toBe(404)
    signInAs(demoSeller)
    expect((await post('apt-001', term)).status).toBe(403)
    signInAs(null)
    expect((await post('apt-001', term)).status).toBe(401)
    expect(
      (await GET(new Request('http://localhost'), context('missing'))).status,
    ).toBe(404)
  })
})
