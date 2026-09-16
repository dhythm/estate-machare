import type { Metadata } from 'next'
import { BadgeCheck } from 'lucide-react'
import { BackLink } from '@/components/back-link'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { AgentProfileForm } from '@/components/agents/agent-profile-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { getAgentProfile } from '@/lib/server/agents'
import type { AgentProfileInput } from '@/lib/validation/agent'

export const metadata: Metadata = { title: '担当者登録 | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function AgentRegisterPage() {
  const user = await getCurrentUser()
  const profile = user ? await getAgentProfile(user.id) : undefined
  const initial: (AgentProfileInput & { note?: string }) | undefined = profile
    ? {
        name: profile.name,
        kind: profile.kind,
        prefecture: profile.prefecture,
        handledCategories:
          profile.handledCategories as AgentProfileInput['handledCategories'],
        serviceAreas: profile.serviceAreas,
        note: profile.note,
      }
    : undefined
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BackLink href="/requests" label="物件リクエストにもどる" />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 xl:top-24">
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BadgeCheck className="size-5" />
            </span>
            <PageIntro
              title="担当者として登録する"
              description="空いている物件を、次の住まいに。対応地域と取扱カテゴリに合うリクエストがマイページに届きます。"
            />
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {user ? (
              <AgentProfileForm
                contact={{ name: user.name, email: user.email }}
                initial={initial}
              />
            ) : (
              <LoginPrompt
                action="担当者として登録する"
                callbackUrl="/requests/register"
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
