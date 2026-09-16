import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { PageShell } from '@/components/page-shell'
import { getCurrentUser } from '@/lib/server/auth/session'
import { readCallbackUrl } from '@/lib/validation/auth'

export const metadata: Metadata = { title: 'ログイン | Estate Machare' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const callbackUrl = readCallbackUrl((await searchParams).callbackUrl)
  if (await getCurrentUser()) redirect(callbackUrl)
  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-0 px-5 py-10 sm:px-8 sm:py-16 md:grid-cols-2">
        <div className="relative hidden min-h-[540px] overflow-hidden rounded-l-2xl bg-primary md:block">
          <Image
            src="/estate-hero.webp"
            alt="自然光が差し込む住まい"
            fill
            sizes="50vw"
            className="object-cover object-[65%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
          <div className="absolute bottom-12 left-10 right-10 text-white">
            <p className="text-[10px] tracking-[0.2em] text-accent">
              ROOM FOR YOUR NEXT CHAPTER.
            </p>
            <h2 className="mt-5 font-display text-4xl font-bold leading-relaxed">
              次の住まい。
              <br />
              次のつながり。
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/75">
              あなたらしい暮らしの、つづきへ。
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-7 sm:p-12 md:rounded-l-none lg:p-16">
          <p className="eyebrow">WELCOME BACK</p>
          <h1 className="mt-4 font-display text-3xl font-bold">ログイン</h1>
          <div className="mt-9">
            <LoginForm callbackUrl={callbackUrl} />
          </div>
          <div className="mt-9 border-t border-border pt-6">
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Estate Machare をはじめて使う方へ
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
