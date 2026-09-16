import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAgentProfile,
  listAgentProfiles,
  matchAgentsForRequest,
  matchRequestsForAgent,
  upsertAgentProfile,
} from './agents'
import { resetStore } from './store'
import { getPropertyRequest } from './property-requests'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const tokyo = {
  name: '高橋不動産',
  kind: '宅建業者' as const,
  prefecture: '東京都',
  handledCategories: ['マンション' as const],
  serviceAreas: ['東京都', '神奈川県'],
}

describe('agent profiles', () => {
  it('creates and updates one profile per user', async () => {
    const created = await upsertAgentProfile(demoUser, tokyo)
    expect(created).toMatchObject({ id: 'demo-user', name: '高橋不動産' })
    const updated = await upsertAgentProfile(demoUser, {
      ...tokyo,
      handledCategories: ['戸建'],
    })
    expect(updated.handledCategories).toEqual(['戸建'])
    expect(updated.createdAt).toBe(created.createdAt)
    expect(await listAgentProfiles()).toHaveLength(1)
    expect((await getAgentProfile('demo-user'))?.handledCategories).toEqual([
      '戸建',
    ])
    expect(await getAgentProfile('nobody')).toBeUndefined()
  })
})

describe('matching', () => {
  it('ranks a local agent above one who only serves the area', async () => {
    // pr-01 wants a マンション in 東京都 世田谷区.
    await upsertAgentProfile(demoUser, tokyo)
    await upsertAgentProfile(demoSeller, {
      ...tokyo,
      name: '横浜不動産',
      prefecture: '神奈川県',
      serviceAreas: ['東京都'],
    })
    const request = (await getPropertyRequest('pr-01'))!
    expect(
      (await matchAgentsForRequest(request)).map((match) => [
        match.profile.name,
        match.score,
      ]),
    ).toEqual([
      ['高橋不動産', 2],
      ['横浜不動産', 1],
    ])
  })

  it('drops agents who do not handle the category or the area', async () => {
    await upsertAgentProfile(demoUser, tokyo)
    const request = (await getPropertyRequest('pr-01'))!
    expect(
      await matchAgentsForRequest({ ...request, category: '土地' }),
    ).toEqual([])
    expect(
      await matchAgentsForRequest({
        ...request,
        prefecture: '沖縄県',
        city: '那覇市',
      }),
    ).toEqual([])
  })

  it('lists open approved requests inside the agent areas and categories', async () => {
    const profile = await upsertAgentProfile(demoUser, tokyo)
    const requests = await matchRequestsForAgent(profile)
    expect(requests.map((request) => request.id)).toContain('pr-01')
    expect(requests.every((request) => request.status === '募集中')).toBe(true)
    expect(requests.every((request) => request.category === 'マンション')).toBe(
      true,
    )
  })
})
