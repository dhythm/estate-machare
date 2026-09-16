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
  const notifications = await getStore().notifications.list()
  return notifications.filter((notification) => notification.userId === userId)
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
  if (!notification || notification.userId !== userId) return undefined
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
