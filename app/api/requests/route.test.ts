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
  item: 'トラクター 25馬力',
  from: '長野県 松本市',
  to: '長野県 諏訪市',
  distanceKm: '40',
  weight: '約1.2t',
  desiredDate: '相談',
  reward: '14000',
  contactEmail: 'owner@example.com',
}

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/transport/requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

describe('/api/transport/requests', () => {
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
      item: input.title,
      status: '募集中',
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
    })
    expect(JSON.stringify(body)).not.toContain('owner@example.com')
    const listed = await (await GET()).json()
    expect(listed[0].id).toBe('tj-01')
    expect(listed.map((request: { id: string }) => request.id)).not.toContain(body.id)
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post(input)).status).toBe(401)
  })

  it('validates input', async () => {
    const response = await post({ ...input, reward: '' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('reward')
  })
})
