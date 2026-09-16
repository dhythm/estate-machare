import type { Metadata } from 'next'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { ReviewTable } from '@/components/admin/admin-tables'
import { listAllReviews } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: 'レビュー | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <ReviewTable items={await listAllReviews()} />
    </AdminSection>
  )
}
