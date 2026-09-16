import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PropertyRequestPage from './page'
import { getPropertyRequest } from '@/lib/server/property-requests'
import { getCurrentUser } from '@/lib/server/auth/session'

vi.mock('@/components/page-shell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/lib/server/property-requests', () => ({ getPropertyRequest: vi.fn() }))
vi.mock('@/lib/server/auth/session', () => ({
  getCurrentUser: vi.fn(),
  canView: () => true,
}))
vi.mock('@/lib/server/agents', () => ({
  getAgentProfile: vi.fn(),
  matchAgentsForJob: async () => [],
}))

describe('transport request detail', () => {
  it('keeps the owner edit action available after a request enters coordination', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'owner',
      name: 'Owner',
      email: 'owner@example.com',
      role: 'user',
    })
    vi.mocked(getPropertyRequest).mockResolvedValue({
      id: 'request-1',
      item: 'トラクター',
      from: '新潟県',
      to: '長野県',
      distanceKm: 180,
      weight: '2t',
      desiredDate: '10月1日',
      reward: 45000,
      status: '調整中',
      ownerUserId: 'owner',
    })

    render(await PropertyRequestPage({ params: Promise.resolve({ id: 'request-1' }) }))
    expect(screen.getByRole('link', { name: '編集する' })).toHaveAttribute(
      'href',
      '/transport/request-1/edit',
    )
    expect(
      screen.queryByRole('button', { name: '応募する' }),
    ).not.toBeInTheDocument()
  })
})
