// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationList } from './notification-list'

const { push, refresh, invalidateQueries } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  invalidateQueries: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  push.mockReset()
  refresh.mockReset()
  invalidateQueries.mockReset()
})

const items = [
  {
    id: 'n-1',
    userId: 'demo-user',
    kind: 'reply' as const,
    title: '返信が届きました',
    body: 'クボタ 45馬力',
    href: '/account/threads/t-1',
    createdAt: '2026-09-13T06:00:00.000Z',
  },
  {
    id: 'n-2',
    userId: 'demo-user',
    kind: 'lease' as const,
    title: '賃貸借契約が「入居中」になりました',
    href: '/account',
    createdAt: '2026-09-13T05:00:00.000Z',
    readAt: '2026-09-13T05:30:00.000Z',
  },
]

describe('NotificationList', () => {
  it('filters to unread notifications and restores the complete history', async () => {
    render(<NotificationList items={items} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /未読のみ/ }))
    expect(
      screen.getByRole('button', { name: /返信が届きました/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /賃貸借契約が/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /^すべて 2/ }))
    expect(
      screen.getByRole('button', { name: /賃貸借契約が/ }),
    ).toBeInTheDocument()
  })

  it('marks a notification read before following its link', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    render(<NotificationList items={items} />)
    expect(screen.getByText('クボタ 45馬力')).toBeInTheDocument()
    expect(screen.getByText('未読')).toBeInTheDocument()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /返信が届きました/ }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/n-1',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(push).toHaveBeenCalledWith('/account/threads/t-1')
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['notifications', 'unread-count'],
    })
  })

  it('marks everything read', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<NotificationList items={items} />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'すべて既読にする' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/read-all',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(refresh).toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['notifications', 'unread-count'],
    })
  })

  it('shows an empty state', () => {
    render(<NotificationList items={[]} />)
    expect(screen.getByText('通知はまだありません')).toBeInTheDocument()
  })
})
