import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'
import { resetStore } from '@/lib/server/store'
import { demoSeller, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

describe('GET /api/listings', () => {
  it('returns the first page when filters are omitted', async () => {
    const response = await GET(new Request('http://localhost/api/listings'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items).toHaveLength(12)
    expect(body).toMatchObject({ page: 1, pageSize: 12 })
    expect(body.total).toBeGreaterThanOrEqual(40)
    expect(body.pageCount).toBe(Math.ceil(body.total / 12))
  })

  it('returns filtered, searched, and paged listings', async () => {
    const response = await GET(
      new Request(
        'http://localhost/api/listings?category=トラクター&deal=rent&q=クボタ&page=1&pageSize=3',
      ),
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.length).toBeLessThanOrEqual(3)
    expect(body.items[0]).toMatchObject({ id: 'trc-001' })
    expect(body.pageSize).toBe(3)
  })

  it('passes refinements through and rejects invalid ones', async () => {
    const ok = await GET(
      new Request(
        'http://localhost/api/listings?prefecture=新潟県&priceMax=20000000&sort=priceDesc&from=2026-10-01&to=2026-10-07',
      ),
    )
    expect(ok.status).toBe(200)
    const body = await ok.json()
    expect(
      body.items.every(
        (item: { prefecture: string }) => item.prefecture === '新潟県',
      ),
    ).toBe(true)
    expect(
      body.items.every(
        (item: { rentPerMonth?: number }) => item.rentPerMonth !== undefined,
      ),
    ).toBe(true)
  })

  it.each([
    'deal=buy',
    'prefecture=不明',
    'priceMin=abc',
    'sort=random',
    'from=2026-10-07&to=2026-10-01',
    'category=unknown',
    'deal=',
    'category=',
    'deal=rent&deal=sale',
    'category=すべて&category=ドローン',
    'page=0',
    'page=abc',
    'pageSize=0',
    'pageSize=1000',
    `q=${'あ'.repeat(101)}`,
  ])('rejects invalid or ambiguous filters: %s', async (query) => {
    const response = await GET(
      new Request(`http://localhost/api/listings?${query}`),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toHaveProperty('error')
  })
})

const submission = {
  name: 'クボタ トラクター 30馬力',
  category: 'トラクター',
  maker: 'クボタ',
  year: '2018',
  hours: '500',
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: '1500000',
  rentPerMonth: '',
  purchaseOption: false,
  summary: 'キャビン付き。',
  sellerName: 'テスト農園',
  sellerKind: '農業法人',
  contactEmail: 'seller@example.com',
}

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

describe('POST /api/listings', () => {
  it('creates a pending listing that is omitted from the public list', async () => {
    const response = await post(submission)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Date.parse(body.receivedAt)).not.toBeNaN()
    expect(body.listing).toMatchObject({
      id: body.id,
      name: submission.name,
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(body)).not.toContain('seller@example.com')
    const list = await (
      await GET(new Request('http://localhost/api/listings?pageSize=1'))
    ).json()
    expect(list.items[0].id).toBe('trc-001')
    expect(list.items.map((item: { id: string }) => item.id)).not.toContain(
      body.id,
    )
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post(submission)).status).toBe(401)
  })

  it('returns field errors for an invalid submission', async () => {
    const response = await post({ ...submission, name: '', deals: [] })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(Object.keys(body.errors).sort()).toEqual(['deals', 'name'])
  })

  it('rejects malformed JSON', async () => {
    const response = await post('{not json')
    expect(response.status).toBe(400)
    expect(await response.json()).toHaveProperty('error')
  })
})
