import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { POST as createJob } from '../../route'
import { resetStore } from '@/lib/server/store'
import { demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const application = {
  name: '高橋 健',
  email: 'ken@example.com',
  vehicle: 'マンション',
  availableDate: '2026-10-03',
}

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/requests/${id}/applications`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )
}

describe('POST /api/requests/[id]/applications', () => {
  it('accepts an application for an open request', async () => {
    expect((await post('pr-01', application)).status).toBe(201)
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post('pr-01', application)).status).toBe(401)
  })

  it('rejects an application unless the request is open', async () => {
    const response = await post('pr-03', application)
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe(
      '募集中のリクエストにのみ提案できます。',
    )
  })

  it('rejects an unknown request', async () => {
    expect((await post('missing', application)).status).toBe(404)
  })

  it('rejects an application for a pending request', async () => {
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
          budget: '14000',
          moveInDate: '2026-12-01',
          contactEmail: 'owner@example.com',
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    expect((await post(id, application)).status).toBe(404)
  })

  it('returns field errors', async () => {
    const response = await post('pr-01', { ...application, availableDate: '' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('availableDate')
  })
})
