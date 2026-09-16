// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminTabs } from './admin-tabs'

const usePathname = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ usePathname }))

describe('AdminTabs', () => {
  it('marks the current tab', () => {
    usePathname.mockReturnValue('/admin/deals/leases')
    render(
      <AdminTabs
        items={[
          { href: '/admin/deals', label: '出品' },
          { href: '/admin/deals/leases', label: 'レンタル' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'レンタル' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: '出品' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
