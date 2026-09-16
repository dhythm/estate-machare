import 'server-only'

import { randomUUID } from 'node:crypto'
import { getStore, type Notification, type NotificationKind } from './store'

export type NotificationInput = {
  userId: string
  kind: NotificationKind
  title: string
  body?: string
  href: string
}

export function notify(input: NotificationInput): Promise<Notification> {
  return getStore().notifications.create({
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  })
}

/** Newest first, as the store lists them. */
export async function listNotifications(
  userId: string,
): Promise<Notification[]> {
  const [notifications, retiredThreadIds] = await Promise.all([
    getStore().notifications.list(),
    retiredTransportThreadIds(),
  ])
  return notifications.filter(
    (notification) =>
      notification.userId === userId &&
      !isRetiredNotification(notification, retiredThreadIds),
  )
}

export async function countUnread(userId: string): Promise<number> {
  return (await listNotifications(userId)).filter(
    (notification) => notification.readAt === undefined,
  ).length
}

/** Only the recipient can mark a notification read. */
export async function markRead(
  id: string,
  userId: string,
): Promise<Notification | undefined> {
  const store = getStore()
  const notification = await store.notifications.get(id)
  if (
    !notification ||
    notification.userId !== userId ||
    isRetiredNotification(notification, await retiredTransportThreadIds())
  )
    return undefined
  if (notification.readAt) return notification
  return store.notifications.update(id, { readAt: new Date().toISOString() })
}

export async function markAllRead(userId: string): Promise<void> {
  const store = getStore()
  const unread = (await listNotifications(userId)).filter(
    (notification) => notification.readAt === undefined,
  )
  const readAt = new Date().toISOString()
  await Promise.all(
    unread.map((notification) =>
      store.notifications.update(notification.id, { readAt }),
    ),
  )
}

async function retiredTransportThreadIds(): Promise<Set<string>> {
  const submissions = await getStore().submissions.list()
  return new Set(
    submissions
      .filter(
        (submission) =>
          submission.kind === 'transportApplication' ||
          submission.kind === 'transportInquiry',
      )
      .map((submission) => submission.id),
  )
}

function isRetiredNotification(
  notification: Notification,
  retiredThreadIds: Set<string>,
): boolean {
  const path = notification.href.split(/[?#]/, 1)[0]
  if (
    notification.kind === 'application' ||
    path === '/transport' ||
    path.startsWith('/transport/') ||
    path.startsWith('/account/carrier') ||
    path.startsWith('/admin/transport') ||
    path.startsWith('/admin/carriers') ||
    path.startsWith('/admin/applications') ||
    path.startsWith('/account/deals/transportJob/')
  )
    return true
  const threadId = path.match(/^\/account\/threads\/([^/]+)$/)?.[1]
  return threadId !== undefined && retiredThreadIds.has(threadId)
}
