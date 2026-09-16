import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PropertyRequestPage from './page'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { getCurrentUser } from '@/lib/server/auth/session'

vi.mock('@/components/page-shell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/lib/server/property-requests', () => ({
  getPropertyRequest: vi.fn(),
}))
vi.mock('@/lib/server/auth/session', () => ({
  getCurrentUser: vi.fn(),
  canView: () => true,
}))
vi.mock('@/lib/server/agents', () => ({
  getAgentProfile: vi.fn(),
  matchAgentsForRequest: async () => [],
}))
vi.mock('@/lib/server/sellers', () => ({
  listListingsForOwner: async () => [],
}))

describe('property request detail', () => {
  it('keeps the owner edit action available after a request enters coordination', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'owner',
      name: 'Owner',
      email: 'owner@example.com',
      role: 'user',
    })
    vi.mocked(getPropertyRequest).mockResolvedValue({
      id: 'request-1',
      title: '駅徒歩10分以内の2LDKを借りたい',
      deal: 'rent',
      category: 'マンション',
      layout: '2LDK',
      prefecture: '東京都',
      city: '世田谷区',
      budget: 45000,
      moveInDate: '2026-12-01',
      status: '調整中',
      ownerUserId: 'owner',
    })

    render(
      await PropertyRequestPage({
        params: Promise.resolve({ id: 'request-1' }),
      }),
    )
    expect(screen.getByRole('link', { name: '編集する' })).toHaveAttribute(
      'href',
      '/requests/request-1/edit',
    )
    expect(
      screen.queryByRole('button', { name: '提案する' }),
    ).not.toBeInTheDocument()
  })
})
