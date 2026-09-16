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
  vehicle: '2tトラック',
  availableDate: '2026-10-03',
}

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/transport/requests/${id}/applications`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )
}

describe('POST /api/transport/requests/[id]/applications', () => {
  it('accepts an application for an open request', async () => {
    expect((await post('tj-01', application)).status).toBe(201)
  })

  it('requires login', async () => {
    signInAs(null)
    expect((await post('tj-01', application)).status).toBe(401)
  })

  it('rejects an application unless the request is open', async () => {
    const response = await post('tj-03', application)
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe(
      '募集中の案件にのみ応募できます。',
    )
  })

  it('rejects an unknown request', async () => {
    expect((await post('missing', application)).status).toBe(404)
  })

  it('rejects an application for a pending request', async () => {
    const created = await createJob(
      new Request('http://localhost/api/transport/requests', {
        method: 'POST',
        body: JSON.stringify({
          item: '審査中トラクター',
          from: '長野県 松本市',
          to: '長野県 諏訪市',
          distanceKm: '40',
          weight: '約1.2t',
          desiredDate: '相談',
          reward: '14000',
          contactEmail: 'owner@example.com',
        }),
      }),
    )
    const { id } = (await created.json()) as { id: string }
    expect((await post(id, application)).status).toBe(404)
  })

  it('returns field errors', async () => {
    const response = await post('tj-01', { ...application, availableDate: '' })
    expect(response.status).toBe(400)
    expect((await response.json()).errors).toHaveProperty('availableDate')
  })
})
