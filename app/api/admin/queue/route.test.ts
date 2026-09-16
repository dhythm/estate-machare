import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { POST as createListing } from '../../listings/route'
import { POST as createJob } from '../../transport/jobs/route'
import { resetStore } from '@/lib/server/store'

const auth = vi.hoisted(() => vi.fn())

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => ({ auth }))

const adminUser = {
  id: 'demo-admin',
  email: 'admin@example.com',
  name: '運営デモ',
  role: 'admin',
}

beforeEach(() => {
  auth.mockResolvedValue({ user: adminUser })
  return resetStore()
})

afterEach(() => {
  auth.mockReset()
})

const listingBody = {
  name: '審査中マンション',
  category: 'マンション',
  maker: '世田谷',
  year: '2018',
  hours: '500',
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: '1000000',
  rentPerDay: '',
  rentToOwn: false,
  summary: '審査中。',
  sellerName: '審査農園',
  sellerKind: '不動産会社',
  contactEmail: 'seller@example.com',
}

function adminGet(url: string) {
  return GET(new Request(url))
}

function adminPost(body: unknown) {
  return POST(
    new Request('http://localhost/api/admin/queue', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

describe('/api/admin/queue', () => {
  it('requires a signed-in admin', async () => {
    const body = JSON.stringify({
      kind: 'listing',
      id: 'trc-001',
      status: 'approved',
    })
    auth.mockResolvedValue(null)
    expect((await adminGet('http://localhost/api/admin/queue')).status).toBe(
      401,
    )
    expect((await adminPost(JSON.parse(body))).status).toBe(401)

    auth.mockResolvedValue({ user: { ...adminUser, role: 'user' } })
    expect((await adminGet('http://localhost/api/admin/queue')).status).toBe(
      403,
    )
    expect((await adminPost(JSON.parse(body))).status).toBe(403)
  })

  it('lists pending items and approves a listing onto the public catalog', async () => {
    const created = await createListing(
      new Request('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(listingBody),
      }),
    )
    const { id } = (await created.json()) as { id: string }

    const queue = await (
      await adminGet('http://localhost/api/admin/queue')
    ).json()
    expect(queue.listings.map((item: { id: string }) => item.id)).toEqual([id])

    const approved = await adminPost({
      kind: 'listing',
      id,
      status: 'approved',
      note: '掲載可',
    })
    expect(approved.status).toBe(200)
    expect(await approved.json()).toMatchObject({
      id,
      moderationStatus: 'approved',
      moderationNote: '掲載可',
    })
    expect(
      (await (await adminGet('http://localhost/api/admin/queue')).json())
        .listings,
    ).toEqual([])
  })

  it('rejects a pending transport job', async () => {
    const created = await createJob(
      new Request('http://localhost/api/transport/jobs', {
        method: 'POST',
        body: JSON.stringify({
          item: '審査中コンバイン',
          from: '秋田県 大仙市',
          to: '山形県 天童市',
          distanceKm: '120',
          weight: '約2.4t',
          desiredDate: '相談',
          reward: '38000',
          contactEmail: 'owner@example.com',
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    const rejected = await adminPost({
      kind: 'transportJob',
      id,
      status: 'rejected',
      note: '区間が不明瞭',
    })
    expect(rejected.status).toBe(200)
    expect((await rejected.json()).moderationStatus).toBe('rejected')
  })

  it('validates the filter and the decision body', async () => {
    expect(
      (await adminGet('http://localhost/api/admin/queue?status=maybe')).status,
    ).toBe(400)
    expect(
      (await adminPost({ kind: 'listing', id: '', status: 'approved' })).status,
    ).toBe(400)
    expect(
      (
        await adminPost({
          kind: 'listing',
          id: 'missing',
          status: 'approved',
        })
      ).status,
    ).toBe(404)
  })
})
