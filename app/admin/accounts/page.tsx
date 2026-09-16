import type { Metadata } from 'next'
import { AdminSection } from '@/components/admin/admin-section'
import { AccountTable } from '@/components/admin/admin-tables'
import { listAccountSummaries } from '@/lib/server/admin-overview'
import { getCurrentUser } from '@/lib/server/auth/session'

export const metadata: Metadata = {
  title: 'アカウント管理 | Estate Machare 運営',
}

export const dynamic = 'force-dynamic'

export default async function AdminAccountsPage() {
  const user = await getCurrentUser()
  return (
    <AdminSection title="アカウント管理">
      <AccountTable
        items={await listAccountSummaries()}
        currentUserId={user?.id ?? ''}
      />
    </AdminSection>
  )
}
