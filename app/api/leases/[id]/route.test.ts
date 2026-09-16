import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from './route'
import { getListing } from '@/lib/server/listings'
import { requestLease } from '@/lib/server/leases'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )

describe('PATCH /api/leases/[id]', () => {
  it('applies transitions with the right status codes', async () => {
    const listing = (await getListing('apt-001'))!
    const created = await requestLease(listing, demoUser, {
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
    expect((await converted.json()).purchasePrice).toBe(87_866_000)
    signInAs(demoAdmin)
    expect((await patch(id, { status: 'completed' })).status).toBe(409)
    signInAs(null)
    expect((await patch(id, { status: 'completed' })).status).toBe(401)
    signInAs(demoSeller)
    expect((await patch('missing', { status: 'active' })).status).toBe(404)
  })
})
