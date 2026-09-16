import type { Metadata } from 'next'
import { AdminSection, transportTabs } from '@/components/admin/admin-section'
import { AgentTable } from '@/components/admin/admin-tables'
import { listAgents } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '運搬者 | Agri Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminAgentsPage() {
  return (
    <AdminSection title="運搬管理" tabs={transportTabs}>
      <AgentTable items={await listAgents()} />
    </AdminSection>
  )
}
