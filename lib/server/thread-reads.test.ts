import { beforeEach, describe, expect, it, vi } from 'vitest'
import { markThreadRead, unreadThreadIds } from './thread-reads'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { addMessage } from './threads'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

async function openInquiry() {
  return (
    await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'apt-001', userId: 'demo-user' },
    )
  ).id
}

const later = () => new Promise((resolve) => setTimeout(resolve, 5))

describe('thread reads', () => {
  it('counts the opening message as unread for the owner only', async () => {
    const id = await openInquiry()
    expect(await unreadThreadIds('demo-seller')).toEqual([id])
    expect(await unreadThreadIds('demo-user')).toEqual([])
    await markThreadRead(id, 'demo-seller')
    expect(await unreadThreadIds('demo-seller')).toEqual([])
  })

  it('flags replies from the other side until the thread is opened again', async () => {
    const id = await openInquiry()
    await markThreadRead(id, 'demo-seller')
    await later()
    await addMessage(id, demoSeller, '在庫あります')
    expect(await unreadThreadIds('demo-seller')).toEqual([])
    expect(await unreadThreadIds('demo-user')).toEqual([id])
    await markThreadRead(id, 'demo-user')
    expect(await unreadThreadIds('demo-user')).toEqual([])
    await later()
    await addMessage(id, demoUser, '見に行きます')
    expect(await unreadThreadIds('demo-seller')).toEqual([id])
    expect(await unreadThreadIds('demo-user')).toEqual([])
    await later()
    await markThreadRead(id, 'demo-seller')
    expect(await unreadThreadIds('demo-seller')).toEqual([])
  })

  it('ignores threads the user is not part of', async () => {
    await openInquiry()
    expect(await unreadThreadIds('demo-admin')).toEqual([])
  })
})
