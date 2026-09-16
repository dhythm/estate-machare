import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { POST as createListing } from '../../listings/route'
import { POST as createJob } from '../../requests/route'
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
  name: '審査中トラクター',
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: '1000000',
  rentPerMonth: '',
  purchaseOption: false,
  summary: '審査中。',
  sellerName: '審査農園',
  sellerKind: '宅建業者',
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
      id: 'apt-001',
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

  it('rejects a pending property request', async () => {
    const created = await createJob(
      new Request('http://localhost/api/requests/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: '駅徒歩10分以内の2LDKを借りたい',
          deal: 'rent',
          category: 'マンション',
          layout: '2LDK',
          prefecture: '東京都',
          city: '世田谷区',
          budget: '38000',
          moveInDate: '2026-12-01',
          contactEmail: 'owner@example.com',
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    const rejected = await adminPost({
      kind: 'propertyRequest',
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
