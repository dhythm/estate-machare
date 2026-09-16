import type { Metadata } from 'next'
import { Truck } from 'lucide-react'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { CarrierProfileForm } from '@/components/carriers/carrier-profile-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getCarrierProfile } from '@/lib/server/carriers'
import type { CarrierProfileInput } from '@/lib/validation/carrier'

export const metadata: Metadata = {
  title: '引越しパートナー登録 | Estate Machare',
}

export const dynamic = 'force-dynamic'

export default async function TransportRegisterPage() {
  const user = await getCurrentUser()
  const profile = user ? await getCarrierProfile(user.id) : undefined
  const initial: (CarrierProfileInput & { note?: string }) | undefined = profile
    ? {
        name: profile.name,
        kind: profile.kind,
        prefecture: profile.prefecture,
        vehicles: profile.vehicles as CarrierProfileInput['vehicles'],
        serviceAreas: profile.serviceAreas,
        note: profile.note,
      }
    : undefined
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href="/transport" label="引越し案件にもどる" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24">
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Truck className="size-5" />
            </span>
            <PageIntro
              title="引越しパートナーとして登録する"
              description="空きトラックや帰り便を、次の仕事に。対応地域に合う案件がマイページに届きます。"
            />
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {user ? (
              <CarrierProfileForm
                contact={{ name: user.name, email: user.email }}
                initial={initial}
              />
            ) : (
              <LoginPrompt
                action="引越しパートナーとして登録する"
                callbackUrl="/transport/register"
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
