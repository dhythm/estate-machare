import type { Metadata } from 'next'
import { AdminQueue } from '@/components/admin/admin-queue'
import { AdminSection, transportTabs } from '@/components/admin/admin-section'
import { getModerationQueue } from '@/lib/server/moderation'

export const metadata: Metadata = { title: '運搬管理 | Agri Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminTransportPage() {
  return (
    <AdminSection title="運搬管理" tabs={transportTabs}>
      <AdminQueue
        kind="propertyRequest"
        initialQueue={await getModerationQueue('all')}
      />
    </AdminSection>
  )
}
