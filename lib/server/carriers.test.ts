import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCarrierProfile,
  listCarrierProfiles,
  matchCarriersForJob,
  matchJobsForCarrier,
  parseTons,
  upsertCarrierProfile,
} from './carriers'
import { resetStore } from './store'
import { getTransportJob } from './transport'
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

describe('carrier profiles', () => {
  it('creates and updates one profile per user', async () => {
    const created = await upsertCarrierProfile(demoUser, akita)
    expect(created).toMatchObject({ id: 'demo-user', name: '高橋運送' })
    const updated = await upsertCarrierProfile(demoUser, {
      ...akita,
      vehicles: ['4tトラック'],
    })
    expect(updated.vehicles).toEqual(['4tトラック'])
    expect(updated.createdAt).toBe(created.createdAt)
    expect(await listCarrierProfiles()).toHaveLength(1)
    expect((await getCarrierProfile('demo-user'))?.vehicles).toEqual([
      '4tトラック',
    ])
    expect(await getCarrierProfile('nobody')).toBeUndefined()
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
  it('ranks carriers by matching areas and filters by capacity', async () => {
    await upsertCarrierProfile(demoUser, akita)
    await upsertCarrierProfile(demoSeller, {
      ...akita,
      name: '大型運送',
      vehicles: ['4tトラック'],
      serviceAreas: ['山形県'],
    })
    const job = { ...(await getTransportJob('tj-01'))!, weight: '約2.4t' }
    const matches = await matchCarriersForJob(job)
    expect(matches.map((match) => match.profile.name)).toEqual(['大型運送'])
    const light = await matchCarriersForJob({ ...job, weight: '約1t' })
    expect(light.map((match) => [match.profile.name, match.score])).toEqual([
      ['高橋運送', 2],
      ['大型運送', 1],
    ])
    expect(
      await matchCarriersForJob({
        ...job,
        from: '沖縄県 那覇市',
        to: '沖縄県 名護市',
      }),
    ).toEqual([])
  })

  it('lists open approved jobs inside the carrier areas', async () => {
    const profile = await upsertCarrierProfile(demoUser, akita)
    const jobs = await matchJobsForCarrier(profile)
    expect(jobs.map((job) => job.id)).toContain('tj-01')
    expect(jobs.every((job) => job.status === '募集中')).toBe(true)
  })
})
