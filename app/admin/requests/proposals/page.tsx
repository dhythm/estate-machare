import type { Metadata } from 'next'
import { AdminSection, transportTabs } from '@/components/admin/admin-section'
import { ThreadTable } from '@/components/admin/admin-tables'
import { listTransportApplications } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '応募 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
  return (
    <AdminSection title="リクエスト管理" tabs={transportTabs}>
      <ThreadTable items={await listTransportApplications()} />
    </AdminSection>
  )
}
