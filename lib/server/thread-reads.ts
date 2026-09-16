import 'server-only'

import { isThreadKind } from '@/lib/data'
import { getStore, type Submission } from './store'

const readId = (threadId: string, userId: string) => `${threadId}:${userId}`

export async function markThreadRead(
  threadId: string,
  userId: string,
): Promise<void> {
  const store = getStore()
  const id = readId(threadId, userId)
  const readAt = new Date().toISOString()
  const existing = await store.threadReads.get(id)
  if (existing) await store.threadReads.update(id, { readAt })
  else await store.threadReads.create({ id, threadId, userId, readAt })
}

function isThread(submission: Submission): boolean {
  return isThreadKind(submission.kind)
}

/**
 * Threads with something the user has not seen: the opening message for the
 * owner, or a reply from the other side newer than the user's last visit.
 */
export async function unreadThreadIds(userId: string): Promise<string[]> {
  const store = getStore()
  const [submissions, messages, reads, listings, requests] = await Promise.all([
    store.submissions.list(),
    store.messages.list(),
    store.threadReads.list(),
    store.listings.list(),
    store.propertyRequests.list(),
  ])
  const ownerOf = new Map<string, string | undefined>()
  for (const listing of listings) ownerOf.set(listing.id, listing.ownerUserId)
  for (const request of requests) ownerOf.set(request.id, request.ownerUserId)
  const readAtOf = new Map(
    reads
      .filter((read) => read.userId === userId)
      .map((read) => [read.threadId, read.readAt]),
  )
  const unread: string[] = []
  for (const submission of submissions) {
    if (!isThread(submission) || !submission.targetId) continue
    const isSender = submission.userId === userId
    const isOwner = ownerOf.get(submission.targetId) === userId
    if (!isSender && !isOwner) continue
    const readAt = readAtOf.get(submission.id)
    if (isOwner && !isSender && readAt === undefined) {
      unread.push(submission.id)
      continue
    }
    const hasNew = messages.some(
      (message) =>
        message.threadId === submission.id &&
        message.senderUserId !== userId &&
        (readAt === undefined || message.createdAt > readAt),
    )
    if (hasNew) unread.push(submission.id)
  }
  return unread
}
