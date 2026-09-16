import type { Metadata } from 'next'
import { AdminQueue } from '@/components/admin/admin-queue'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { getModerationQueue } from '@/lib/server/moderation'

export const metadata: Metadata = { title: '取引管理 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminDealsPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <AdminQueue
        kind="listing"
        initialQueue={await getModerationQueue('all')}
      />
    </AdminSection>
  )
}
