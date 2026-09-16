import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const groups = [
  {
    title: '物件をつなぐ',
    links: [
      { label: '物件を買う', href: '/listings?deal=sale' },
      { label: '借りる', href: '/listings?deal=rent' },
      { label: '借りてから買う', href: '/listings?deal=purchaseOption' },
      { label: '物件を出品する', href: '/listings/new' },
    ],
  },
  {
    title: '人と物件をつなぐ',
    links: [
      { label: '希望条件を登録する', href: '/requests/new' },
      { label: '物件リクエストを探す', href: '/requests' },
      { label: '担当者登録', href: '/requests/register' },
      { label: '初期費用のめやす', href: '/costs' },
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
    <footer className="bg-[#173a4f] text-white">
      <div className="mx-auto max-w-[1360px] px-5 pb-8 pt-14 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" aria-label="Estate Machare ホーム">
              <BrandLogo inverse />
            </Link>
            <p className="mt-7 font-display text-2xl font-bold leading-relaxed">
              不動産と、次の可能性を。
            </p>
            <p className="mt-4 max-w-xs text-xs leading-7 text-white/65">
              所有する人、必要とする人、仲介する人。
              <br />
              ひとつの物件から、次の暮らしをつないでいく。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-bold text-[#e3b778]">
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
          <p className="tracking-wider">© 2026 Estate Machare</p>
        </div>
      </div>
    </footer>
  )
}
