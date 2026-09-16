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
  name: '高橋運送',
  kind: '法人',
  prefecture: '秋田県',
  vehicles: ['2tトラック'],
  serviceAreas: ['秋田県', '山形県'],
}

const put = (body: unknown) =>
  PUT(
    new Request('http://localhost', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  )

describe('/api/transport/agent-profile', () => {
  it('returns null before registration, then saves and returns the profile', async () => {
    expect(await (await GET()).json()).toEqual({ profile: null })
    const saved = await put(profile)
    expect(saved.status).toBe(200)
    expect(await saved.json()).toMatchObject({
      id: 'demo-user',
      name: '高橋運送',
    })
    expect((await (await GET()).json()).profile).toMatchObject({
      vehicles: ['2tトラック'],
    })
    expect((await put({ ...profile, vehicles: [] })).status).toBe(400)
    signInAs(null)
    expect((await GET()).status).toBe(401)
    expect((await put(profile)).status).toBe(401)
  })
})
