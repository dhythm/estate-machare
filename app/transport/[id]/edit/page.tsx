import type { Metadata } from 'next'
import { Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { TransportJobForm } from '@/components/forms/transport-job-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { canManage } from '@/lib/server/auth/access'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getTransportJob } from '@/lib/server/transport'

export const metadata: Metadata = {
  title: '引越し依頼を編集する | Estate Machare',
}

export const dynamic = 'force-dynamic'

export default async function EditTransportJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const job = await getTransportJob(id)
  if (!job) notFound()
  if (user && !canManage(user, job)) notFound()

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href={`/transport/${id}`} label="案件の詳細にもどる" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24">
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Pencil className="size-5" />
            </span>
            <PageIntro title="引越し依頼を編集する" description={job.item} />
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {user ? (
              <TransportJobForm
                contact={{ name: user.name, email: user.email }}
                edit={{
                  jobId: job.id,
                  values: {
                    item: job.item,
                    from: job.from,
                    to: job.to,
                    distanceKm: String(job.distanceKm),
                    weight: job.weight,
                    desiredDate: job.desiredDate,
                    reward: String(job.reward),
                    contactEmail: user.email,
                  },
                }}
              />
            ) : (
              <LoginPrompt
                action="引越し依頼を編集する"
                callbackUrl={`/transport/${id}/edit`}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
