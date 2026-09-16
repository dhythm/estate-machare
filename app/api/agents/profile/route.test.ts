import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PUT } from './route'
import { resetStore } from '@/lib/server/store'
import { demoUser, signInAs } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/auth', () => import('@/test/mock-auth'))

beforeEach(() => {
  signInAs(demoUser)
  return resetStore()
})

const profile = {
  name: '高橋不動産',
  kind: '法人',
  prefecture: '秋田県',
  handledCategories: ['マンション'],
  serviceAreas: ['秋田県', '山形県'],
}

const put = (body: unknown) =>
  PUT(
    new Request('http://localhost', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  )

describe('/api/agents/profile', () => {
  it('returns null before registration, then saves and returns the profile', async () => {
    expect(await (await GET()).json()).toEqual({ profile: null })
    const saved = await put(profile)
    expect(saved.status).toBe(200)
    expect(await saved.json()).toMatchObject({
      id: 'demo-user',
      name: '高橋不動産',
    })
    expect((await (await GET()).json()).profile).toMatchObject({
      handledCategories: ['マンション'],
    })
    expect(
      (await put({ ...profile, handledCategories: ['別荘'] })).status,
    ).toBe(400)
    signInAs(null)
    expect((await GET()).status).toBe(401)
    expect((await put(profile)).status).toBe(401)
  })
})
