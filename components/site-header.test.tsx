// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SiteHeader } from './site-header'

vi.mock('next/navigation', () => ({ usePathname: () => '/listings/trc-001' }))
vi.mock('@/components/auth/account-menu', () => ({ AccountMenu: () => null }))

describe('SiteHeader', () => {
  it('identifies the current service in both navigation layouts and keeps listing creation reachable', () => {
    render(<SiteHeader />)
    for (const name of ['メインナビゲーション', 'サービスナビゲーション']) {
      const nav = within(screen.getByRole('navigation', { name }))
      expect(
        nav.queryByRole('link', { name: '引越しサポート' }),
      ).not.toBeInTheDocument()
      expect(nav.getByRole('link', { name: '物件を探す' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(nav.getByRole('link', { name: 'はじめての方へ' })).toHaveAttribute(
        'href',
        '/guide',
      )
    }
    expect(
      screen
        .getAllByRole('link', { name: '物件を掲載' })
        .every((link) => link.getAttribute('href') === '/listings/new'),
    ).toBe(true)
  })
})
