import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  isThreadKind,
  threadKindLabels,
  threadStatusLabels,
  type Listing,
  type ThreadStatus,
  type PropertyRequest,
} from '@/lib/data'
import type { AuthenticatedUser } from './auth/accounts'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { getStore, type Message, type Submission } from './store'

type ThreadTarget =
  | { kind: 'listing'; listing: Listing }
  | { kind: 'propertyRequest'; request: PropertyRequest }

type ThreadRole = 'sender' | 'owner' | 'admin'

export type Thread = {
  submission: Submission
  status: ThreadStatus
  /** Missing when the listing or request was deleted after the thread opened. */
  target?: ThreadTarget
  messages: Message[]
  role: ThreadRole
}

export type ThreadResult<T> =
  { ok: true; value: T } | { ok: false; reason: 'not_found' | 'forbidden' }

const notFound = { ok: false, reason: 'not_found' } as const
const forbidden = { ok: false, reason: 'forbidden' } as const

function isThread(submission: Submission): boolean {
  return isThreadKind(submission.kind)
}

async function loadTarget(
  submission: Submission,
): Promise<ThreadTarget | undefined> {
  if (!submission.targetId) return undefined
  const store = getStore()
  if (submission.kind === 'listingInquiry') {
    const listing = await store.listings.get(submission.targetId)
    return listing ? { kind: 'listing', listing } : undefined
  }
  const request = await store.propertyRequests.get(submission.targetId)
  return request ? { kind: 'propertyRequest', request } : undefined
}

function ownerOf(target: ThreadTarget | undefined): string | undefined {
  if (!target) return undefined
  return target.kind === 'listing'
    ? target.listing.ownerUserId
    : target.request.ownerUserId
}

function targetLabel(target: ThreadTarget | undefined): string | undefined {
  if (!target) return undefined
  return target.kind === 'listing' ? target.listing.name : target.request.title
}

function kindLabel(submission: Submission): string {
  return isThreadKind(submission.kind)
    ? threadKindLabels[submission.kind]
    : 'やり取り'
}

function roleFor(
  user: AuthenticatedUser,
  submission: Submission,
  target: ThreadTarget | undefined,
): ThreadRole | undefined {
  if (submission.userId === user.id) return 'sender'
  if (ownerOf(target) === user.id) return 'owner'
  if (user.role === 'admin') return 'admin'
  return undefined
}

/** Messages of a thread, oldest first. */
export async function listMessages(threadId: string): Promise<Message[]> {
  const messages = await getStore().messages.list()
  return messages
    .filter((message) => message.threadId === threadId)
    .reverse()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function resolve(
  threadId: string,
  user: AuthenticatedUser,
): Promise<
  ThreadResult<{
    submission: Submission
    target?: ThreadTarget
    role: ThreadRole
  }>
> {
  const submission = await getStore().submissions.get(threadId)
  if (!submission || !isThread(submission)) return notFound
  const target = await loadTarget(submission)
  const role = roleFor(user, submission, target)
  if (!role) return forbidden
  return { ok: true, value: { submission, target, role } }
}

export async function getThread(
  threadId: string,
  user: AuthenticatedUser,
): Promise<ThreadResult<Thread>> {
  const resolved = await resolve(threadId, user)
  if (!resolved.ok) return resolved
  const { submission, target, role } = resolved.value
  return {
    ok: true,
    value: {
      submission,
      status: submission.status ?? 'new',
      target,
      messages: await listMessages(threadId),
      role,
    },
  }
}

/** Participants reply; admins only read. */
export async function addMessage(
  threadId: string,
  user: AuthenticatedUser,
  body: string,
): Promise<ThreadResult<Message>> {
  const resolved = await resolve(threadId, user)
  if (!resolved.ok) return resolved
  const { submission, target, role } = resolved.value
  if (role === 'admin') return forbidden
  const message = await getStore().messages.create({
    id: randomUUID(),
    threadId,
    senderUserId: user.id,
    body,
    createdAt: new Date().toISOString(),
  })
  const recipient = role === 'sender' ? ownerOf(target) : submission.userId
  if (recipient)
    await notify({
      userId: recipient,
      kind: 'reply',
      title: '返信が届きました',
      body: targetLabel(target),
      href: `/account/threads/${threadId}`,
    })
  return { ok: true, value: message }
}

/** The target's owner (or an admin) drives the status; accepting an application books the request. */
export async function updateThreadStatus(
  threadId: string,
  user: AuthenticatedUser,
  status: ThreadStatus,
): Promise<ThreadResult<Submission>> {
  const resolved = await resolve(threadId, user)
  if (!resolved.ok) return resolved
  const { submission, target, role } = resolved.value
  if (role === 'sender') return forbidden
  const store = getStore()
  const updated = await store.submissions.update(threadId, { status })
  if (!updated) return notFound
  if (submission.userId)
    await notify({
      userId: submission.userId,
      kind: 'threadStatus',
      title: `${kindLabel(submission)}が「${threadStatusLabels[status]}」になりました`,
      body: targetLabel(target),
      href: `/account/threads/${threadId}`,
    })
  if (
    status === 'agreed' &&
    target?.kind === 'propertyRequest' &&
    target.request.status === '募集中'
  ) {
    await store.propertyRequests.update(target.request.id, {
      status: '調整中',
      updatedAt: new Date().toISOString(),
    })
    await recordDealEvent({
      dealKind: 'propertyRequest',
      dealId: target.request.id,
      status: '調整中',
      actorUserId: user.id,
      note: '応募を成約',
    })
  }
  return { ok: true, value: updated }
}

/** Remove every reply of the given threads (used when a target is deleted). */
export async function deleteMessagesFor(threadIds: string[]): Promise<void> {
  if (threadIds.length === 0) return
  const ids = new Set(threadIds)
  const messages = await getStore().messages.list()
  await Promise.all(
    messages
      .filter((message) => ids.has(message.threadId))
      .map((message) => getStore().messages.delete(message.id)),
  )
}
