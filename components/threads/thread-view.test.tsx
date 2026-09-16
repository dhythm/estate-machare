// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Thread } from '@/lib/server/threads'
import { ThreadView } from './thread-view'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const thread: Thread = {
  submission: {
    id: 't-1',
    kind: 'listingInquiry',
    targetId: 'apt-001',
    userId: 'demo-user',
    receivedAt: '2026-09-13T01:00:00.000Z',
    payload: {
      mode: 'rent',
      name: '利用者デモ',
      email: 'u@example.com',
      message: '借りたいです',
    },
    status: 'new',
  },
  status: 'new',
  target: {
    kind: 'listing',
    listing: {
      id: 'apt-001',
      name: 'クボタ 45馬力',
      category: 'マンション',
      zoning: '第一種住居地域',
      layout: '3LDK',
      floorArea: 74.2,
      builtYear: 2019,
      nearestStation: '小田急線 経堂駅',
      walkMinutes: 6,
      prefecture: '新潟県',
      city: '長岡市',
      image: '/properties/apartment.svg',
      summary: '',
      deals: ['rent'],
      rentPerMonth: 22_000,
      seller: {
        name: '中村不動産',
        kind: '宅建業者',
        rating: 4.8,
        reviews: 34,
      },
      tags: [],
      ownerUserId: 'demo-seller',
    },
  },
  messages: [
    {
      id: 'm-1',
      threadId: 't-1',
      senderUserId: 'demo-seller',
      body: '在庫あります',
      createdAt: '2026-09-13T02:00:00.000Z',
    },
  ],
  role: 'sender',
}

afterEach(() => {
  vi.unstubAllGlobals()
  refresh.mockReset()
})

describe('ThreadView', () => {
  it('shows the opening message, replies, and posts a new reply', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'm-2' }, { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<ThreadView thread={thread} currentUserId="demo-user" />)
    expect(screen.getByText('借りたいです')).toBeInTheDocument()
    expect(screen.getByText('在庫あります')).toBeInTheDocument()
    expect(screen.getByText('相手')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'クボタ 45馬力' })).toHaveAttribute(
      'href',
      '/listings/apt-001',
    )
    expect(screen.queryByRole('button', { name: '成約' })).toBeNull()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('返信'), '見に行きます')
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/threads/t-1/messages',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(refresh).toHaveBeenCalled()
  })

  it('lets the owner change the status', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: 'agreed' }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <ThreadView
        thread={{ ...thread, role: 'owner' }}
        currentUserId="demo-seller"
      />,
    )
    expect(screen.getByText('自分')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '成約' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/threads/t-1',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({ status: 'agreed' })
    expect(refresh).toHaveBeenCalled()
  })

  it('offers a transport request once an inquiry is agreed', () => {
    render(
      <ThreadView
        thread={{ ...thread, status: 'agreed' }}
        currentUserId="demo-user"
      />,
    )
    expect(
      screen.getByRole('link', { name: '希望条件を登録する' }),
    ).toHaveAttribute('href', '/requests/new?listingId=apt-001')
  })

  it('shows the review form to the sender of an agreed inquiry', () => {
    render(
      <ThreadView
        thread={{ ...thread, status: 'agreed' }}
        currentUserId="demo-user"
        canReview
      />,
    )
    expect(
      screen.getByRole('button', { name: 'レビューを送る' }),
    ).toBeInTheDocument()
  })

  it('hides the reply form from admins', () => {
    render(
      <ThreadView
        thread={{ ...thread, role: 'admin' }}
        currentUserId="demo-admin"
      />,
    )
    expect(screen.queryByLabelText('返信')).toBeNull()
  })
})
