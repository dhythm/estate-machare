import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from './route'
import { POST as reply } from './messages/route'
import { resetStore } from '@/lib/server/store'
import { acceptSubmission } from '@/lib/server/submissions'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

const context = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

async function openInquiry() {
  return (
    await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'apt-001', userId: 'demo-user' },
    )
  ).id
}

async function openApplication() {
  return (
    await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: 'マンション',
        availableDate: '2026-10-03',
      },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
  ).id
}

const patch = (id: string, body: unknown) =>
  PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    context(id),
  )

describe('GET /api/threads/[id]', () => {
  it('returns the thread to participants and admins', async () => {
    const id = await openInquiry()
    await reply(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ body: '見に行けますか' }),
      }),
      context(id),
    )
    const response = await GET(new Request('http://localhost'), context(id))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      status: 'new',
      role: 'sender',
      target: { kind: 'listing', listing: { id: 'apt-001' } },
    })
    expect(body.messages.map((m: { body: string }) => m.body)).toEqual([
      '見に行けますか',
    ])
    signInAs(demoSeller)
    expect(
      (await (await GET(new Request('http://localhost'), context(id))).json())
        .role,
    ).toBe('owner')
    signInAs(demoAdmin)
    expect(
      (await GET(new Request('http://localhost'), context(id))).status,
    ).toBe(200)
  })

  it('denies signed-out users, strangers, and unknown ids', async () => {
    const id = await openInquiry()
    signInAs(null)
    expect(
      (await GET(new Request('http://localhost'), context(id))).status,
    ).toBe(401)
    signInAs({ ...demoUser, id: 'stranger' })
    expect(
      (await GET(new Request('http://localhost'), context(id))).status,
    ).toBe(403)
    signInAs(demoUser)
    expect(
      (await GET(new Request('http://localhost'), context('nope'))).status,
    ).toBe(404)
  })
})

describe('PATCH /api/threads/[id]', () => {
  it('lets the owner set the status and books the request on agreement', async () => {
    const id = await openApplication()
    expect((await patch(id, { status: 'agreed' })).status).toBe(403)
    signInAs(demoSeller)
    expect((await patch(id, { status: 'done' })).status).toBe(400)
    const response = await patch(id, { status: 'agreed' })
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('agreed')
    expect((await getPropertyRequest('pr-01'))?.status).toBe('調整中')
    signInAs(demoAdmin)
    expect((await patch(id, { status: 'declined' })).status).toBe(200)
    signInAs(null)
    expect((await patch(id, { status: 'agreed' })).status).toBe(401)
  })
})
