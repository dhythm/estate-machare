import type { Metadata } from 'next'
import { Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { PropertyRequestForm } from '@/components/forms/property-request-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { canManage } from '@/lib/server/auth/access'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getPropertyRequest } from '@/lib/server/property-requests'

export const metadata: Metadata = {
  title: 'リクエストを編集する | Estate Machare',
}

export const dynamic = 'force-dynamic'

export default async function EditPropertyRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const request = await getPropertyRequest(id)
  if (!request) notFound()
  if (user && !canManage(user, request)) notFound()

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href={`/requests/${id}`} label="リクエストの詳細にもどる" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24">
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Pencil className="size-5" />
            </span>
            <PageIntro
              title="リクエストを編集する"
              description={request.title}
            />
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {user ? (
              <PropertyRequestForm
                contact={{ name: user.name, email: user.email }}
                edit={{
                  requestId: request.id,
                  values: {
                    title: request.title,
                    deal: request.deal,
                    category: request.category,
                    layout: request.layout ?? '',
                    prefecture: request.prefecture,
                    city: request.city,
                    budget: String(request.budget),
                    moveInDate: request.moveInDate,
                    contactEmail: user.email,
                  },
                }}
              />
            ) : (
              <LoginPrompt
                action="リクエストを編集する"
                callbackUrl={`/requests/${id}/edit`}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
