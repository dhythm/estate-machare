import type { Metadata } from 'next'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { ThreadTable } from '@/components/admin/admin-tables'
import { listThreadSummaries } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '問い合わせ | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminInquiriesPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <ThreadTable items={await listThreadSummaries('listingInquiry')} />
    </AdminSection>
  )
}
