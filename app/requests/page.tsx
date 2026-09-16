import { PageShell } from '@/components/page-shell'
import { RequestBoard } from '@/components/request-board'

export const dynamic = 'force-dynamic'

export default function TransportPage() {
  return (
    <PageShell>
      <RequestBoard />
    </PageShell>
  )
}
