import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { DealTimeline } from '@/components/deals/deal-timeline'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getDeal } from '@/lib/server/deals'
import type { DealKind } from '@/lib/server/store'

export const metadata: Metadata = { title: '取引の履歴 | Estate Machare' }

export const dynamic = 'force-dynamic'

const kinds: DealKind[] = ['order', 'rental', 'transportJob']

export default async function DealPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (!kinds.includes(kind as DealKind)) notFound()
  const user = await getCurrentUser()
  if (!user)
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/account/deals/${kind}/${id}`)}`,
    )
  const result = await getDeal(kind as DealKind, id, user)
  if (!result.ok) notFound()

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink href="/account" label="マイページにもどる" />
        <div className="mt-6">
          <PageIntro title="取引の履歴" />
        </div>
        <div className="mt-8">
          <DealTimeline deal={result.value} />
        </div>
      </div>
    </PageShell>
  )
}
