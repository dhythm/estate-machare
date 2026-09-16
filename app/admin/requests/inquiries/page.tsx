import type { Metadata } from 'next'
import { AdminSection, requestTabs } from '@/components/admin/admin-section'
import { ThreadTable } from '@/components/admin/admin-tables'
import { listThreadSummaries } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '質問 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminTransportInquiriesPage() {
  return (
    <AdminSection title="リクエスト管理" tabs={requestTabs}>
      <ThreadTable items={await listThreadSummaries('requestInquiry')} />
    </AdminSection>
  )
}
