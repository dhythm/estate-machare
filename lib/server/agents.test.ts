import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAgentProfile,
  listAgentProfiles,
  matchAgentsForJob,
  matchJobsForAgent,
  parseTons,
  upsertAgentProfile,
} from './agents'
import { resetStore } from './store'
import { getPropertyRequest } from './property-requests'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const akita = {
  name: '高橋運送',
  kind: '法人' as const,
  prefecture: '秋田県',
  vehicles: ['2tトラック' as const],
  serviceAreas: ['秋田県', '山形県'],
}

describe('agent profiles', () => {
  it('creates and updates one profile per user', async () => {
    const created = await upsertAgentProfile(demoUser, akita)
    expect(created).toMatchObject({ id: 'demo-user', name: '高橋運送' })
    const updated = await upsertAgentProfile(demoUser, {
      ...akita,
      vehicles: ['4tトラック'],
    })
    expect(updated.vehicles).toEqual(['4tトラック'])
    expect(updated.createdAt).toBe(created.createdAt)
    expect(await listAgentProfiles()).toHaveLength(1)
    expect((await getAgentProfile('demo-user'))?.vehicles).toEqual([
      '4tトラック',
    ])
    expect(await getAgentProfile('nobody')).toBeUndefined()
  })
})

describe('parseTons', () => {
  it('reads tons and kilograms from free text', () => {
    expect(parseTons('約2.4t')).toBe(2.4)
    expect(parseTons('1,800kg')).toBe(1.8)
    expect(parseTons('軽量')).toBeUndefined()
  })
})

describe('matching', () => {
  it('ranks agents by matching areas and filters by capacity', async () => {
    await upsertAgentProfile(demoUser, akita)
    await upsertAgentProfile(demoSeller, {
      ...akita,
      name: '大型運送',
      vehicles: ['4tトラック'],
      serviceAreas: ['山形県'],
    })
    const request = (await getPropertyRequest('tj-01'))! // 秋田県 → 山形県, 約2.4t
    const matches = await matchAgentsForJob(request)
    expect(matches.map((match) => match.profile.name)).toEqual(['大型運送'])
    const light = await matchAgentsForJob({ ...request, weight: '約1t' })
    expect(light.map((match) => [match.profile.name, match.score])).toEqual([
      ['高橋運送', 2],
      ['大型運送', 1],
    ])
    expect(
      await matchAgentsForJob({
        ...request,
        from: '沖縄県 那覇市',
        to: '沖縄県 名護市',
      }),
    ).toEqual([])
  })

  it('lists open approved requests inside the agent areas', async () => {
    const profile = await upsertAgentProfile(demoUser, akita)
    const requests = await matchJobsForAgent(profile)
    expect(requests.map((request) => request.id)).toContain('tj-01')
    expect(requests.every((request) => request.status === '募集中')).toBe(true)
  })
})
