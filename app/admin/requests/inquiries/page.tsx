import type { Metadata } from 'next'
import { AdminSection, transportTabs } from '@/components/admin/admin-section'
import { ThreadTable } from '@/components/admin/admin-tables'
import { listThreadSummaries } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '質問 | Agri Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminTransportInquiriesPage() {
  return (
    <AdminSection title="運搬管理" tabs={transportTabs}>
      <ThreadTable items={await listThreadSummaries('requestInquiry')} />
    </AdminSection>
  )
}
