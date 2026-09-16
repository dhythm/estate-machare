import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { POST as createListing } from '../../route'
import { resetStore } from '@/lib/server/store'
import { listSubmissions } from '@/lib/server/submissions'
import { demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const inquiry = {
  mode: 'rent',
  name: '山田 太郎',
  email: 'taro@example.com',
  preferredDate: '2026-10-01',
  message: '1週間ほど借りたいです。',
}

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/listings/${id}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )
}

describe('POST /api/listings/[id]/inquiries', () => {
  it('accepts an inquiry for an existing listing and records the sender', async () => {
    const response = await post('apt-001', inquiry)
    expect(response.status).toBe(201)
    expect(await response.json()).toHaveProperty('id')
    const [stored] = await listSubmissions('listingInquiry', 'apt-001')
    expect(stored.userId).toBe('demo-user')
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post('apt-001', inquiry)).status).toBe(401)
  })

  it('rejects an inquiry for an unknown listing', async () => {
    const response = await post('missing', inquiry)
    expect(response.status).toBe(404)
  })

  it('rejects an inquiry for a pending listing', async () => {
    const created = await createListing(
      new Request('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify({
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
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    expect((await post(id, inquiry)).status).toBe(404)
  })

  it('rejects a mode the listing does not offer', async () => {
    const response = await post('lnd-004', { ...inquiry, mode: 'rent' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('mode')
  })

  it('returns field errors', async () => {
    const response = await post('apt-001', { ...inquiry, email: 'bad' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('email')
  })
})
