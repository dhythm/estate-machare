import type { Metadata } from 'next'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { RentalTable } from '@/components/admin/admin-tables'
import { listAllRentals } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '賃貸 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminRentalsPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <RentalTable items={await listAllRentals()} />
    </AdminSection>
  )
}
