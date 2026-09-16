import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { NotificationList } from '@/components/notifications/notification-list'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { listNotifications } from '@/lib/server/notifications'

export const metadata: Metadata = { title: '通知 | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?callbackUrl=%2Faccount%2Fnotifications')
  const items = await listNotifications(user.id)

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <BackLink href="/account" label="マイページにもどる" />
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-primary">
            NOTIFICATIONS
          </p>
          <PageIntro title="通知" />
        </div>
        <div className="mt-8">
          <NotificationList items={items} />
        </div>
      </div>
    </PageShell>
  )
}
