import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { RequestInquiryForm } from '@/components/forms/request-inquiry-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { formatYen } from '@/lib/data'
import { canView, getCurrentUser } from '@/lib/server/auth/session'
import { getPropertyRequest } from '@/lib/server/property-requests'

export const metadata: Metadata = { title: '案件に質問する | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function TransportInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const request = await getPropertyRequest(id)
  const user = await getCurrentUser()
  if (!request || !canView(user, request) || request.status === '成約')
    notFound()

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink href={`/requests/${id}`} label="案件の詳細にもどる" />
        <div className="mt-6">
          <PageIntro
            title="案件に質問する"
            description={`${request.title}（${request.prefecture} ${request.city}・${formatYen(request.budget)}）`}
          />
        </div>
        <div className="mt-8">
          {user ? (
            <RequestInquiryForm requestId={request.id} />
          ) : (
            <LoginPrompt
              action="案件に質問する"
              callbackUrl={`/requests/${id}/inquiry`}
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}
