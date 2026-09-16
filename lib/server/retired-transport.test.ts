import { beforeEach, expect, it, vi } from 'vitest'
import { getStore, resetStore } from './store'
import { getThread, addMessage, updateThreadStatus } from './threads'
import { getDeal, listDealsForUser } from './deals'
import { getAccountOverview } from './account'
import { listRecentActivity, getAdminCounts } from './admin-overview'
import { countUnread, listNotifications, markRead } from './notifications'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))
beforeEach(() => resetStore())

it('keeps historical moving records inaccessible through property account services', async () => {
  const store = getStore()
  await store.submissions.create({
    id: 'old-moving',
    kind: 'transportApplication',
    targetId: 'tj-01',
    userId: demoUser.id,
    receivedAt: new Date().toISOString(),
    payload: {},
  })
  await store.dealEvents.create({
    id: 'old-event',
    dealKind: 'transportJob',
    dealId: 'tj-01',
    status: '完了',
    createdAt: new Date().toISOString(),
  })
  for (const href of [
    '/transport/tj-01',
    '/account/deals/transportJob/tj-01',
    '/account/threads/old-moving',
  ]) {
    await store.notifications.create({
      id: href,
      userId: demoUser.id,
      kind: 'reply',
      title: '引越し',
      href,
      createdAt: new Date().toISOString(),
    })
    expect(await markRead(href, demoUser.id)).toBeUndefined()
  }
  expect(await getThread('old-moving', demoUser)).toEqual({
    ok: false,
    reason: 'not_found',
  })
  expect(await addMessage('old-moving', demoUser, 'hello')).toEqual({
    ok: false,
    reason: 'not_found',
  })
  expect(await updateThreadStatus('old-moving', demoSeller, 'agreed')).toEqual({
    ok: false,
    reason: 'not_found',
  })
  expect(await getDeal('transportJob', 'tj-01', demoSeller)).toEqual({
    ok: false,
    reason: 'not_found',
  })
  expect(
    (await listDealsForUser(demoSeller.id)).every((deal) =>
      ['order', 'rental'].includes(deal.kind),
    ),
  ).toBe(true)
  expect(await listNotifications(demoUser.id)).toEqual([])
  expect(await countUnread(demoUser.id)).toBe(0)
  expect((await getAccountOverview(demoUser.id)).unreadThreadIds).toEqual([])
  expect((await getAdminCounts()).openThreads).toBe(0)
  expect(await listRecentActivity(5)).toEqual([])
  expect(await store.submissions.get('old-moving')).toBeDefined()
  expect(await store.dealEvents.get('old-event')).toBeDefined()
})
