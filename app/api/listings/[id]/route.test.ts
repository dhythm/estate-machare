import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, PUT } from './route'
import { POST as createInquiry } from './inquiries/route'
import { POST as createListing } from '../route'
import { listSubmissions } from '@/lib/server/submissions'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoSeller)
  return resetStore()
})

const submission = {
  name: '更新後のマンション',
  category: 'マンション',
  maker: '世田谷',
  year: '2018',
  hours: '500',
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['rent'],
  salePrice: '',
  rentPerDay: '9000',
  rentToOwn: false,
  summary: '更新しました。',
  sellerName: '中村ファーム',
  sellerKind: '不動産会社',
  contactEmail: 'seller@example.com',
}

const context = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/listings/[id]', () => {
  it('returns the listing or 404', async () => {
    const found = await GET(new Request('http://localhost'), context('trc-001'))
    expect(found.status).toBe(200)
    expect((await found.json()).id).toBe('trc-001')
    expect(
      (await GET(new Request('http://localhost'), context('missing'))).status,
    ).toBe(404)
  })

  it('shows a pending listing only to its owner or an admin', async () => {
    const created = await createListing(
      new Request('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify({
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
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    const status = async () =>
      (await GET(new Request('http://localhost'), context(id))).status
    expect(await status()).toBe(200)
    signInAs(demoAdmin)
    expect(await status()).toBe(200)
    signInAs(demoUser)
    expect(await status()).toBe(404)
    signInAs(null)
    expect(await status()).toBe(404)
  })
})

describe('PUT /api/listings/[id]', () => {
  const put = (id: string, body: unknown) =>
    PUT(
      new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
      context(id),
    )

  it('replaces the listing fields and keeps the id', async () => {
    const response = await put('trc-001', submission)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      id: 'trc-001',
      name: '更新後のマンション',
      deals: ['rent'],
    })
    expect(body.salePrice).toBeUndefined()
    expect(
      (
        await (
          await GET(new Request('http://localhost'), context('trc-001'))
        ).json()
      ).name,
    ).toBe('更新後のマンション')
  })

  it('validates the body and reports unknown ids', async () => {
    expect((await put('trc-001', { ...submission, name: '' })).status).toBe(400)
    expect((await put('missing', submission)).status).toBe(404)
  })

  it('is limited to the owner or an admin', async () => {
    signInAs(null)
    expect((await put('trc-001', submission)).status).toBe(401)
    signInAs(demoUser)
    expect((await put('trc-001', submission)).status).toBe(403)
    expect((await put('property-007', submission)).status).toBe(403)
    signInAs(demoAdmin)
    expect((await put('property-007', submission)).status).toBe(200)
  })
})

describe('DELETE /api/listings/[id]', () => {
  it('removes the listing and its inquiries', async () => {
    await createInquiry(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'question',
          name: 'a',
          email: 'a@b.co',
          message: 'x',
        }),
      }),
      context('trc-001'),
    )
    expect(await listSubmissions('listingInquiry', 'trc-001')).toHaveLength(1)
    const response = await DELETE(
      new Request('http://localhost'),
      context('trc-001'),
    )
    expect(response.status).toBe(204)
    expect(
      (await GET(new Request('http://localhost'), context('trc-001'))).status,
    ).toBe(404)
    expect(await listSubmissions('listingInquiry', 'trc-001')).toHaveLength(0)
    expect(
      (await DELETE(new Request('http://localhost'), context('trc-001')))
        .status,
    ).toBe(404)
  })

  it('is limited to the owner or an admin', async () => {
    const remove = (id: string) =>
      DELETE(new Request('http://localhost'), context(id))
    signInAs(null)
    expect((await remove('trc-002')).status).toBe(401)
    signInAs(demoUser)
    expect((await remove('cmb-002')).status).toBe(403)
    signInAs(demoAdmin)
    expect((await remove('property-007')).status).toBe(204)
  })
})
