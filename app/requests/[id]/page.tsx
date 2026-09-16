import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Handshake,
  MapPin,
  Pencil,
  Ruler,
} from 'lucide-react'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { PageShell } from '@/components/page-shell'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { RequestProposalForm } from '@/components/forms/request-proposal-form'
import { formatYen } from '@/lib/data'
import { canView, getCurrentUser } from '@/lib/server/auth/session'
import { listListingsForOwner } from '@/lib/server/sellers'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { canManage } from '@/lib/server/auth/access'
import { getAgentProfile, matchAgentsForRequest } from '@/lib/server/agents'
import { AgentMatches } from '@/components/agents/agent-matches'

export const metadata: Metadata = { title: '物件リクエスト | Estate Machare' }
export const dynamic = 'force-dynamic'

export default async function PropertyRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const request = await getPropertyRequest(id)
  const user = await getCurrentUser()
  if (!request || !canView(user, request)) notFound()
  const manages = canManage(user, request)
  const matches = manages ? await matchAgentsForRequest(request) : []
  const profile = user && !manages ? await getAgentProfile(user.id) : undefined
  const ownListings =
    user && !manages ? await listListingsForOwner(user.id) : []

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <BackLink href="/requests" label="物件リクエストにもどる" />
          {manages && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/requests/${request.id}/edit`}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                <Pencil className="size-3.5" />
                編集する
              </Link>
              <Link
                href={`/account/deals/propertyRequest/${request.id}`}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                取引の履歴
              </Link>
            </div>
          )}
        </div>
        <header className="mt-8 border-b border-border pb-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={request.status === '募集中' ? 'default' : 'muted'}>
              {request.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              物件リクエスト · {request.id}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {request.title}
          </h1>
        </header>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24 lg:self-start">
            <section
              aria-label="希望条件"
              className="overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8"
            >
              <p className="flex items-center gap-2 text-xs font-medium tracking-wider text-primary-foreground/65">
                <Handshake className="size-4" />
                REQUESTED CONDITIONS
              </p>
              <div className="mt-7 grid grid-cols-[auto_1fr] gap-x-4">
                <div className="flex flex-col items-center pt-1">
                  <MapPin className="size-5" />
                  <span className="my-2 min-h-8 flex-1 border-l border-dashed border-primary-foreground/40" />
                  <span className="mb-1 size-3 rounded-full bg-accent" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60">
                    希望エリア
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed">
                    {request.prefecture} {request.city}
                  </p>
                  <p className="mt-7 text-xs text-primary-foreground/60">
                    希望する取引
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed">
                    {request.deal === 'rent' ? '賃貸' : '売買'}
                  </p>
                </div>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-primary-foreground/20 pt-5 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <Building2 className="size-3.5" />
                    カテゴリ
                  </dt>
                  <dd className="mt-2 font-display text-lg font-semibold">
                    {request.category}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <Ruler className="size-3.5" />
                    間取り
                  </dt>
                  <dd className="mt-2 font-display text-lg font-semibold">
                    {request.layout ?? '指定なし'}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <CalendarClock className="size-3.5" />
                    入居・引渡し希望日
                  </dt>
                  <dd className="mt-2 font-semibold">{request.moveInDate}</dd>
                </div>
              </dl>
            </section>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                {request.deal === 'rent' ? '月額賃料の上限' : '予算の上限'}
              </p>
              <p className="font-display text-3xl font-bold tracking-tight text-primary">
                {formatYen(request.budget)}
              </p>
            </div>
            <Link
              href="/costs"
              className="mt-4 inline-flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              初期費用のめやす
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <section className="min-w-0 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              {manages ? 'MANAGE REQUEST' : 'PROPOSAL'}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
              {manages ? 'リクエストの管理' : 'このリクエストに提案する'}
            </h2>
            <div className="mt-6">
              {request.status !== '成約' && !manages && (
                <Link
                  href={`/requests/${request.id}/inquiry`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mb-5 h-9',
                  )}
                >
                  募集者に質問する
                </Link>
              )}
              {request.status !== '募集中' ? (
                <p className="rounded-xl bg-muted p-4 text-sm leading-7 text-muted-foreground">
                  このリクエストは{request.status}
                  のため、提案を受け付けていません。
                </p>
              ) : manages ? (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    このリクエストに合う担当者
                  </h3>
                  <div className="mt-4">
                    <AgentMatches matches={matches} />
                  </div>
                </div>
              ) : user ? (
                <RequestProposalForm
                  request={request}
                  contact={{
                    name: profile?.name ?? user.name,
                    email: user.email,
                  }}
                  listings={ownListings}
                />
              ) : (
                <LoginPrompt
                  action="提案する"
                  callbackUrl={`/requests/${request.id}`}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
