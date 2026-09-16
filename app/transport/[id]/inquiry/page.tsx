import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { TransportInquiryForm } from '@/components/forms/transport-inquiry-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { formatYen } from '@/lib/data'
import { canView, getCurrentUser } from '@/lib/server/auth/session'
import { getTransportJob } from '@/lib/server/transport'

export const metadata: Metadata = { title: '案件に質問する | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function TransportInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getTransportJob(id)
  const user = await getCurrentUser()
  if (!job || !canView(user, job) || job.status === '完了') notFound()

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink href={`/transport/${id}`} label="案件の詳細にもどる" />
        <div className="mt-6">
          <PageIntro
            title="案件に質問する"
            description={`${job.item}（${job.from} → ${job.to}・${formatYen(job.reward)}）`}
          />
        </div>
        <div className="mt-8">
          {user ? (
            <TransportInquiryForm jobId={job.id} />
          ) : (
            <LoginPrompt
              action="案件に質問する"
              callbackUrl={`/transport/${id}/inquiry`}
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}
