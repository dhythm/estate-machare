import type { Metadata } from 'next'
import { AdminQueue } from '@/components/admin/admin-queue'
import { AdminSection, requestTabs } from '@/components/admin/admin-section'
import { getModerationQueue } from '@/lib/server/moderation'

export const metadata: Metadata = {
  title: 'リクエスト管理 | Estate Machare 運営',
}

export const dynamic = 'force-dynamic'

export default async function AdminTransportPage() {
  return (
    <AdminSection title="リクエスト管理" tabs={requestTabs}>
      <AdminQueue
        kind="propertyRequest"
        initialQueue={await getModerationQueue('all')}
      />
    </AdminSection>
  )
}
