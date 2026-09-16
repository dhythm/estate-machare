import type { Metadata } from 'next'
import { AdminSection, requestTabs } from '@/components/admin/admin-section'
import { ThreadTable } from '@/components/admin/admin-tables'
import { listTransportApplications } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '提案 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  return (
    <AdminSection title="リクエスト管理" tabs={requestTabs}>
      <ThreadTable items={await listTransportApplications()} />
    </AdminSection>
  )
}
