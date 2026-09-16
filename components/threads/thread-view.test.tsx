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
    targetId: 'trc-001',
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
      id: 'trc-001',
      name: 'クボタ 45馬力',
      category: 'トラクター',
      maker: 'クボタ',
      year: 2019,
      hours: 620,
      condition: '目立った傷なし',
      prefecture: '新潟県',
      city: '長岡市',
      image: '/equipment/tractor.png',
      summary: '',
      deals: ['rent'],
      rentPerDay: 22_000,
      seller: {
        name: '中村ファーム',
        kind: '農業法人',
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
  it('shows monthly property rent without reinterpreting the legacy daily rate', () => {
    if (thread.target?.kind !== 'listing')
      throw new Error('Expected listing fixture')
    render(
      <ThreadView
        currentUserId="demo-user"
        thread={{
          ...thread,
          target: {
            ...thread.target,
            listing: {
              ...thread.target.listing,
              property: {
                areaSqm: 62,
                floorPlan: '2LDK',
                builtYear: 2019,
                monthlyRent: 125000,
                access: '駅徒歩8分',
              },
            },
          },
        }}
      />,
    )
    expect(screen.getByText('月額賃料')).toBeInTheDocument()
    expect(screen.getByText('¥125,000')).toBeInTheDocument()
    expect(screen.queryByText('短期利用 / 日')).not.toBeInTheDocument()
    expect(screen.queryByText('¥22,000')).not.toBeInTheDocument()
  })

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
      '/listings/trc-001',
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
      screen.getByRole('link', { name: '引越しを依頼する' }),
    ).toHaveAttribute('href', '/transport/new?listingId=trc-001')
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
