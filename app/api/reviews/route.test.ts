import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { getListing } from '@/lib/server/listings'
import { requestLease, updateLeaseStatus } from '@/lib/server/leases'
import { resetStore } from '@/lib/server/store'
import { demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

describe('POST /api/reviews', () => {
  it('creates a review for a completed lease and maps failures', async () => {
    const created = await requestLease(
      (await getListing('apt-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-02',
      },
    )
    const id = created.ok ? created.value.id : ''
    expect(
      (await post({ sourceKind: 'lease', sourceId: id, rating: 5 })).status,
    ).toBe(409)
    await updateLeaseStatus(id, demoSeller, 'active')
    await updateLeaseStatus(id, demoSeller, 'completed')
    expect(
      (await post({ sourceKind: 'lease', sourceId: id, rating: 9 })).status,
    ).toBe(400)
    const ok = await post({
      sourceKind: 'lease',
      sourceId: id,
      rating: 5,
      comment: '最高',
    })
    expect(ok.status).toBe(201)
    expect(await ok.json()).toMatchObject({ rating: 5, comment: '最高' })
    expect(
      (await post({ sourceKind: 'lease', sourceId: id, rating: 4 })).status,
    ).toBe(409)
    signInAs(demoSeller)
    expect(
      (await post({ sourceKind: 'lease', sourceId: id, rating: 4 })).status,
    ).toBe(403)
    expect(
      (await post({ sourceKind: 'lease', sourceId: 'nope', rating: 4 })).status,
    ).toBe(404)
    signInAs(null)
    expect(
      (await post({ sourceKind: 'lease', sourceId: id, rating: 4 })).status,
    ).toBe(401)
  })
})
