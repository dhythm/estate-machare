// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminTabs } from './admin-tabs'

const usePathname = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ usePathname }))

describe('AdminTabs', () => {
  it('marks the current tab', () => {
    usePathname.mockReturnValue('/admin/deals/rentals')
    render(
      <AdminTabs
        items={[
          { href: '/admin/deals', label: '掲載' },
          { href: '/admin/deals/rentals', label: '賃貸' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: '賃貸' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: '掲載' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
