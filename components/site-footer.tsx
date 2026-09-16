import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const groups = [
  {
    title: '農機具をつなぐ',
    links: [
      { label: '農機具を買う', href: '/listings?deal=sale' },
      { label: 'レンタルする', href: '/listings?deal=rent' },
      { label: '借りてから買う', href: '/listings?deal=purchaseOption' },
      { label: '農機具を出品する', href: '/listings/new' },
    ],
  },
  {
    title: '運搬をつなぐ',
    links: [
      { label: '運搬を依頼する', href: '/transport/new' },
      { label: '運搬の仕事を探す', href: '/transport' },
      { label: '運搬者登録', href: '/transport/register' },
      { label: '運搬料金のめやす', href: '/transport/pricing' },
    ],
  },
  {
    title: 'サポート',
    links: [
      { label: 'はじめての方へ', href: '/guide' },
      { label: 'よくある質問', href: '/faq' },
      { label: 'お問い合わせ', href: '/contact' },
      { label: 'マイページ', href: '/account' },
      { label: '運営画面', href: '/admin' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-[#173f35] text-white">
      <div className="mx-auto max-w-[1360px] px-5 pb-8 pt-14 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" aria-label="Agri Machare ホーム">
              <BrandLogo inverse />
            </Link>
            <p className="mt-7 font-display text-2xl font-bold leading-relaxed">
              農機具と、次の可能性を。
            </p>
            <p className="mt-4 max-w-xs text-xs leading-7 text-white/65">
              つくる人、使う人、運ぶ人。
              <br />
              一台の農機具から、農業の未来をつないでいく。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-bold text-[#d9eb8b]">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 text-xs text-white/75 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3 opacity-40" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-[10px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>コンセプト検証版 · 実際の取引・決済は行われません。</p>
          <p className="tracking-wider">© 2026 Agri Machare</p>
        </div>
      </div>
    </footer>
  )
}
