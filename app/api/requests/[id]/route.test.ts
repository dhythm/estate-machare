import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, PUT } from './route'
import { POST as apply } from './proposals/route'
import { POST as createJob } from '../route'
import { listSubmissions } from '@/lib/server/submissions'
import { resetStore } from '@/lib/server/store'
import { demoAdmin, demoSeller, demoUser, signInAs } from '@/test/mock-auth'

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
  budget: '40000',
  moveInDate: '2026-12-01',
  contactEmail: 'owner@example.com',
}

const context = (id: string) => ({ params: Promise.resolve({ id }) })

describe('/api/requests/[id]', () => {
  it('gets a request or 404', async () => {
    expect(
      (await GET(new Request('http://localhost'), context('pr-01'))).status,
    ).toBe(200)
    expect(
      (await GET(new Request('http://localhost'), context('missing'))).status,
    ).toBe(404)
  })

  it('is limited to the owner or an admin', async () => {
    const put = (id: string) =>
      PUT(
        new Request('http://localhost', {
          method: 'PUT',
          body: JSON.stringify(input),
        }),
        context(id),
      )
    const remove = (id: string) =>
      DELETE(new Request('http://localhost'), context(id))
    signInAs(null)
    expect((await put('pr-01')).status).toBe(401)
    expect((await remove('pr-01')).status).toBe(401)
    signInAs(demoUser)
    expect((await put('pr-01')).status).toBe(403)
    expect((await remove('pr-03')).status).toBe(403)
    signInAs(demoAdmin)
    expect((await put('pr-03')).status).toBe(200)
    expect((await remove('pr-03')).status).toBe(204)
  })

  it('shows a pending request only to its owner or an admin', async () => {
    const created = await createJob(
      new Request('http://localhost/api/requests/requests', {
        method: 'POST',
        body: JSON.stringify(input),
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

  it('updates a request', async () => {
    const response = await PUT(
      new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
      context('pr-01'),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: 'pr-01', budget: 40_000 })
    expect(
      (
        await PUT(
          new Request('http://localhost', {
            method: 'PUT',
            body: JSON.stringify(input),
          }),
          context('missing'),
        )
      ).status,
    ).toBe(404)
  })

  it('deletes a request with its applications', async () => {
    await apply(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          name: '高橋',
          email: 'k@example.com',
          vehicle: 'マンション',
          availableDate: '2026-10-03',
        }),
      }),
      context('pr-01'),
    )
    expect(await listSubmissions('requestProposal', 'pr-01')).toHaveLength(1)
    expect(
      (await DELETE(new Request('http://localhost'), context('pr-01'))).status,
    ).toBe(204)
    expect(await listSubmissions('requestProposal', 'pr-01')).toHaveLength(0)
    expect(
      (await DELETE(new Request('http://localhost'), context('pr-01'))).status,
    ).toBe(404)
  })
})
