import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CalendarClock,
  MapPin,
  Route,
  Scale,
  Truck,
  Pencil,
  ArrowRight,
} from 'lucide-react'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { PageShell } from '@/components/page-shell'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { TransportApplicationForm } from '@/components/forms/transport-application-form'
import { formatYen } from '@/lib/data'
import { canView, getCurrentUser } from '@/lib/server/auth/session'
import { getTransportJob } from '@/lib/server/transport'
import { canManage } from '@/lib/server/auth/access'
import { getCarrierProfile, matchCarriersForJob } from '@/lib/server/carriers'
import { CarrierMatches } from '@/components/carriers/carrier-matches'

export const metadata: Metadata = { title: '引越し案件 | Estate Machare' }
export const dynamic = 'force-dynamic'

export default async function TransportJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getTransportJob(id)
  const user = await getCurrentUser()
  if (!job || !canView(user, job)) notFound()
  const manages = canManage(user, job)
  const matches = manages ? await matchCarriersForJob(job) : []
  const profile =
    user && !manages ? await getCarrierProfile(user.id) : undefined

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <BackLink href="/transport" label="引越し案件にもどる" />
          {manages && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/transport/${job.id}/edit`}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                <Pencil className="size-3.5" />
                編集する
              </Link>
              <Link
                href={`/account/deals/transportJob/${job.id}`}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                取引の履歴
              </Link>
            </div>
          )}
        </div>
        <header className="mt-8 border-b border-border pb-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={job.status === '募集中' ? 'default' : 'muted'}>
              {job.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              引越し案件 · {job.id}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {job.item}
          </h1>
        </header>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24 lg:self-start">
            <section
              aria-label="引越し区間"
              className="overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8"
            >
              <p className="flex items-center gap-2 text-xs font-medium tracking-wider text-primary-foreground/65">
                <Truck className="size-4" />
                TRANSPORT ROUTE
              </p>
              <div className="mt-7 grid grid-cols-[auto_1fr] gap-x-4">
                <div className="flex flex-col items-center pt-1">
                  <MapPin className="size-5" />
                  <span className="my-2 min-h-8 flex-1 border-l border-dashed border-primary-foreground/40" />
                  <span className="mb-1 size-3 rounded-full bg-accent" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60">出発地</p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed">
                    {job.from}
                  </p>
                  <p className="mt-7 text-xs text-primary-foreground/60">
                    届け先
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed">
                    {job.to}
                  </p>
                </div>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-primary-foreground/20 pt-5 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <Route className="size-3.5" />
                    距離
                  </dt>
                  <dd className="mt-2 font-display text-lg font-semibold">
                    約{job.distanceKm}km
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <Scale className="size-3.5" />
                    荷物量
                  </dt>
                  <dd className="mt-2 font-display text-lg font-semibold">
                    {job.weight}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs text-primary-foreground/65">
                    <CalendarClock className="size-3.5" />
                    希望日
                  </dt>
                  <dd className="mt-2 font-semibold">{job.desiredDate}</dd>
                </div>
              </dl>
            </section>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">報酬（税込）</p>
              <p className="font-display text-3xl font-bold tracking-tight text-primary">
                {formatYen(job.reward)}
              </p>
            </div>
            <Link
              href="/transport/pricing"
              className="mt-4 inline-flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              引越し料金のめやす
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <section className="min-w-0 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              {manages ? 'MANAGE REQUEST' : 'APPLICATION'}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
              {manages ? '引越し依頼の管理' : 'この案件に応募する'}
            </h2>
            <div className="mt-6">
              {job.status !== '完了' && !manages && (
                <Link
                  href={`/transport/${job.id}/inquiry`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mb-5 h-9',
                  )}
                >
                  依頼者に質問する
                </Link>
              )}
              {job.status !== '募集中' ? (
                <p className="rounded-xl bg-muted p-4 text-sm leading-7 text-muted-foreground">
                  この案件は{job.status}のため、応募を受け付けていません。
                </p>
              ) : manages ? (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    この案件に合う引越しパートナー
                  </h3>
                  <div className="mt-4">
                    <CarrierMatches matches={matches} />
                  </div>
                </div>
              ) : user ? (
                <TransportApplicationForm
                  job={job}
                  contact={{
                    name: profile?.name ?? user.name,
                    email: user.email,
                  }}
                  defaultVehicle={profile?.vehicles[0]}
                />
              ) : (
                <LoginPrompt
                  action="応募する"
                  callbackUrl={`/transport/${job.id}`}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
