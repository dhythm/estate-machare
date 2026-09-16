import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { getPropertyRequest } from './property-requests'
import { deleteListing } from './listings'
import {
  addMessage,
  getThread,
  listMessages,
  updateThreadStatus,
} from './threads'
import { listNotifications } from './notifications'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

const stranger = { ...demoUser, id: 'someone-else' }

beforeEach(() => resetStore())

async function openInquiry() {
  const receipt = await acceptSubmission(
    'listingInquiry',
    { mode: 'rent', name: '利用者デモ', message: '借りたい' },
    { targetId: 'trc-001', userId: 'demo-user' },
  )
  return receipt.id
}

async function openApplication() {
  const receipt = await acceptSubmission(
    'requestProposal',
    { name: '利用者デモ', vehicle: '2tトラック', availableDate: '2026-10-03' },
    { targetId: 'tj-01', userId: 'demo-user' },
  )
  return receipt.id
}

describe('getThread', () => {
  it('shows the thread to the sender, the owner, and admins only', async () => {
    const id = await openInquiry()
    const asSender = await getThread(id, demoUser)
    expect(asSender.ok && asSender.value.role).toBe('sender')
    expect(asSender.ok && asSender.value.target?.kind).toBe('listing')
    expect(asSender.ok && asSender.value.status).toBe('new')
    expect((await getThread(id, demoSeller)).ok && 'owner').toBe('owner')
    const asAdmin = await getThread(id, demoAdmin)
    expect(asAdmin.ok && asAdmin.value.role).toBe('admin')
    const denied = await getThread(id, stranger)
    expect(!denied.ok && denied.reason).toBe('forbidden')
    const missing = await getThread('nope', demoUser)
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('does not expose contact-form submissions as threads', async () => {
    const receipt = await acceptSubmission(
      'contact',
      { message: 'hi' },
      { userId: 'demo-user' },
    )
    const result = await getThread(receipt.id, demoUser)
    expect(!result.ok && result.reason).toBe('not_found')
  })
})

describe('addMessage', () => {
  it('lets both participants reply, oldest first, and blocks others', async () => {
    const id = await openInquiry()
    const reply = await addMessage(id, demoSeller, '在庫あります')
    expect(reply.ok && reply.value).toMatchObject({
      threadId: id,
      senderUserId: 'demo-seller',
      body: '在庫あります',
    })
    await addMessage(id, demoUser, '見に行きます')
    expect((await listMessages(id)).map((m) => m.body)).toEqual([
      '在庫あります',
      '見に行きます',
    ])
    const thread = await getThread(id, demoUser)
    expect(thread.ok && thread.value.messages).toHaveLength(2)
    expect((await addMessage(id, stranger, 'x')).ok).toBe(false)
    expect((await addMessage(id, demoAdmin, 'x')).ok).toBe(false)
  })

  it('removes messages with their thread', async () => {
    const id = await openInquiry()
    await addMessage(id, demoSeller, '在庫あります')
    await deleteListing('trc-001')
    expect(await listMessages(id)).toEqual([])
  })
})

describe('transport inquiries', () => {
  it('opens a thread between the asker and the request owner and notifies the owner', async () => {
    const { id } = await acceptSubmission(
      'requestInquiry',
      { name: '利用者デモ', message: '積載方法は？' },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    const asOwner = await getThread(id, demoSeller)
    expect(asOwner.ok && asOwner.value.role).toBe('owner')
    expect(asOwner.ok && asOwner.value.target?.kind).toBe('propertyRequest')
    const asSender = await getThread(id, demoUser)
    expect(asSender.ok && asSender.value.role).toBe('sender')
    expect(
      (await listNotifications('demo-seller')).map((n) => n.title),
    ).toEqual(['案件への質問が届きました'])
  })
})

describe('updateThreadStatus', () => {
  it('only the owner changes the status', async () => {
    const id = await openInquiry()
    expect((await updateThreadStatus(id, demoUser, 'agreed')).ok).toBe(false)
    const result = await updateThreadStatus(id, demoSeller, 'in_progress')
    expect(result.ok && result.value.status).toBe('in_progress')
  })

  it('lets an admin change the status and notifies the sender', async () => {
    const id = await openInquiry()
    const result = await updateThreadStatus(id, demoAdmin, 'declined')
    expect(result.ok && result.value.status).toBe('declined')
    expect((await listNotifications('demo-user')).map((n) => n.title)).toEqual([
      '問い合わせが「見送り」になりました',
    ])
  })

  it('accepting an application moves the request to 調整中', async () => {
    const id = await openApplication()
    expect((await getPropertyRequest('tj-01'))?.status).toBe('募集中')
    const result = await updateThreadStatus(id, demoSeller, 'agreed')
    expect(result.ok && result.value.status).toBe('agreed')
    expect((await getPropertyRequest('tj-01'))?.status).toBe('調整中')
  })
})
