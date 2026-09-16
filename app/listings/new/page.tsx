import type { Metadata } from 'next'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { ListingForm } from '@/components/forms/listing-form'
import { PageIntro, PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'

export const metadata: Metadata = { title: '掲載する | Estate Machare' }

export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const user = await getCurrentUser()
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <p className="eyebrow mb-5">SHARE YOUR MACHINERY</p>
        <PageIntro
          title="物件を掲載する"
          description="販売とレンタルをひとつの出品でまとめて募集できます。内容を確認のうえ掲載します。"
        />
        <div className="mt-8">
          {user ? (
            <ListingForm contact={{ name: user.name, email: user.email }} />
          ) : (
            <LoginPrompt action="掲載する" callbackUrl="/listings/new" />
          )}
        </div>
      </div>
    </PageShell>
  )
}
