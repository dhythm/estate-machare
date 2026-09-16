import type { Metadata } from 'next'
import { AdminSection, requestTabs } from '@/components/admin/admin-section'
import { AgentTable } from '@/components/admin/admin-tables'
import { listAgents } from '@/lib/server/admin-overview'

export const metadata: Metadata = { title: '担当者 | Estate Machare 運営' }

export const dynamic = 'force-dynamic'

export default async function AdminAgentsPage() {
  return (
    <AdminSection title="リクエスト管理" tabs={requestTabs}>
      <AgentTable items={await listAgents()} />
    </AdminSection>
  )
}
