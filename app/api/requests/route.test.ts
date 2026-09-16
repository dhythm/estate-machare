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

const input = {
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: '140000',
  moveInDate: '2026-12-01',
  contactEmail: 'seeker@example.com',
}

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

describe('/api/requests', () => {
  it('lists requests', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect((await response.json()).length).toBeGreaterThanOrEqual(10)
  })

  it('creates a pending request that is omitted from the public list', async () => {
    const response = await post(input)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.request).toMatchObject({
      id: body.id,
      title: input.title,
      status: '募集中',
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(body)).not.toContain('seeker@example.com')
    const listed = await (await GET()).json()
    expect(listed[0].id).toBe('pr-01')
    expect(listed.map((request: { id: string }) => request.id)).not.toContain(
      body.id,
    )
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post(input)).status).toBe(401)
  })

  it('validates input', async () => {
    const response = await post({ ...input, budget: '' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('budget')
  })
})
