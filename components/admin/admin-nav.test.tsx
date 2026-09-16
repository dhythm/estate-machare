// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminNav } from './admin-nav'

const usePathname = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ usePathname }))

describe('AdminNav', () => {
  it('lists the operator menus and marks the current one', () => {
    usePathname.mockReturnValue('/admin/deals/leases')
    render(<AdminNav />)
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['ダッシュボード', 'アカウント管理', '取引管理', '運搬管理'],
    )
    expect(screen.getByRole('link', { name: '取引管理' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: '取引管理' })).toHaveAttribute(
      'href',
      '/admin/deals',
    )
    expect(
      screen.getByRole('link', { name: 'ダッシュボード' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('marks the dashboard only on its exact path', () => {
    usePathname.mockReturnValue('/admin')
    render(<AdminNav />)
    expect(
      screen.getByRole('link', { name: 'ダッシュボード' }),
    ).toHaveAttribute('aria-current', 'page')
  })
})
