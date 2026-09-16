import type { Metadata } from 'next'
import { AdminSection, dealTabs } from '@/components/admin/admin-section'
import { OrderTable } from '@/components/admin/admin-tables'
import { listAllOrders } from '@/lib/server/orders'

export const metadata: Metadata = { title: '注文 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  return (
    <AdminSection title="取引管理" tabs={dealTabs}>
      <OrderTable items={await listAllOrders()} />
    </AdminSection>
  )
}
