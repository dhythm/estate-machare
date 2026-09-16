import type { ReactNode } from 'react'
import { AdminTabs } from './admin-tabs'

export function AdminSection({
  title,
  description,
  tabs,
  children,
}: {
  title: string
  description?: string
  tabs?: { href: string; label: string }[]
  children: ReactNode
}) {
  return (
    <>
      <div className="mb-7">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
          ESTATE MACHARE / OPERATIONS
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {tabs && (
        <div>
          <AdminTabs items={tabs} />
        </div>
      )}
      <div className="mt-6">{children}</div>
    </>
  )
}

export const dealTabs = [
  { href: '/admin/deals', label: '掲載' },
  { href: '/admin/deals/orders', label: '注文' },
  { href: '/admin/deals/rentals', label: '賃貸' },
  { href: '/admin/deals/inquiries', label: '問い合わせ' },
  { href: '/admin/deals/reviews', label: 'レビュー' },
]
