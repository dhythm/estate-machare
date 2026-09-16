import type { Metadata } from 'next'
import { AdminSection, transportTabs } from '@/components/admin/admin-section'
import { CarrierTable } from '@/components/admin/admin-tables'
import { listCarriers } from '@/lib/server/admin-overview'

export const metadata: Metadata = {
  title: '引越しパートナー | Estate Machare 運営',
}

export const dynamic = 'force-dynamic'

export default async function AdminCarriersPage() {
  return (
    <AdminSection title="引越し管理" tabs={transportTabs}>
      <CarrierTable items={await listCarriers()} />
    </AdminSection>
  )
}
