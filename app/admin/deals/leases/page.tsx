import type { Metadata } from 'next'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { LeaseTable } from '@/components/admin/admin-tables'
import { listAllLeases } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: 'レンタル | Agri Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminLeasesPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <LeaseTable items={await listAllLeases()} />
    </AdminSection>
  )
}
