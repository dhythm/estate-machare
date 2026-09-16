// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PropertyRequestForm } from './property-request-form'

function setup(
  initial?: Parameters<typeof PropertyRequestForm>[0]['initial'],
  edit?: Parameters<typeof PropertyRequestForm>[0]['edit'],
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PropertyRequestForm initial={initial} edit={edit} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

afterEach(() => vi.unstubAllGlobals())

describe('PropertyRequestForm', () => {
  it('edits an existing request with PUT', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'tj-01', updatedAt: '2026-09-13T00:00:00.000Z' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup(undefined, {
      requestId: 'tj-01',
      values: {
        item: 'コンバイン 4条刈',
        from: '秋田県 大仙市',
        to: '山形県 天童市',
        distanceKm: '120',
        weight: '約2.4t',
        desiredDate: '9/28 午前',
        reward: '38000',
        contactEmail: 'seller@example.com',
      },
    })
    expect(screen.getByLabelText('運ぶもの')).toHaveValue('コンバイン 4条刈')
    expect(screen.getByLabelText('出発地の都道府県')).toHaveValue('秋田県')
    expect(screen.getByLabelText('出発地の市区町村')).toHaveValue('大仙市')
    expect(screen.getByLabelText('届け先の都道府県')).toHaveValue('山形県')
    expect(screen.getByLabelText('報酬（円）')).toHaveValue('38000')
    await user.clear(screen.getByLabelText('報酬（円）'))
    await user.type(screen.getByLabelText('報酬（円）'), '40000')
    await user.click(screen.getByRole('button', { name: '更新する' }))
    expect(await screen.findByRole('status')).toHaveTextContent('更新しました')
    expect(
      screen.getByRole('link', { name: '案件の詳細を見る' }),
    ).toHaveAttribute('href', '/transport/tj-01')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transport/requests/tj-01',
      expect.objectContaining({ method: 'PUT' }),
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      reward: '40000',
      from: '秋田県 大仙市',
      to: '山形県 天童市',
    })
  })

  it('fills distance and a suggested reward from the prefectures and category', async () => {
    const user = setup()
    await user.selectOptions(screen.getByLabelText('種類'), 'コンバイン')
    await user.selectOptions(
      screen.getByLabelText('出発地の都道府県'),
      '秋田県',
    )
    await user.selectOptions(
      screen.getByLabelText('届け先の都道府県'),
      '岩手県',
    )
    const distance = Number(
      (screen.getByLabelText('距離（km）') as HTMLInputElement).value,
    )
    expect(distance).toBeGreaterThan(100)
    expect(distance).toBeLessThan(200)
    expect(screen.getByLabelText('報酬（円）')).toHaveValue('75600')
  })

  it('prefills from a listing', () => {
    setup({
      item: 'クボタ トラクター 45馬力',
      category: 'トラクター',
      fromPrefecture: '新潟県',
      fromCity: '長岡市',
    })
    expect(screen.getByLabelText('運ぶもの')).toHaveValue(
      'クボタ トラクター 45馬力',
    )
    expect(screen.getByLabelText('種類')).toHaveValue('トラクター')
    expect(screen.getByLabelText('出発地の都道府県')).toHaveValue('新潟県')
    expect(screen.getByLabelText('出発地の市区町村')).toHaveValue('長岡市')
  })

  it('validates before posting', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.click(screen.getByRole('button', { name: '運搬を依頼する' }))
    expect(screen.getByLabelText('運ぶもの')).toHaveAccessibleDescription(
      '運ぶものを入力してください。',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the request and returns to the board', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'request-1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.type(screen.getByLabelText('運ぶもの'), 'トラクター 25馬力')
    await user.selectOptions(
      screen.getByLabelText('出発地の都道府県'),
      '長野県',
    )
    await user.type(screen.getByLabelText('出発地の市区町村'), '松本市')
    await user.selectOptions(
      screen.getByLabelText('届け先の都道府県'),
      '長野県',
    )
    await user.type(screen.getByLabelText('届け先の市区町村'), '諏訪市')
    await user.clear(screen.getByLabelText('距離（km）'))
    await user.type(screen.getByLabelText('距離（km）'), '40')
    await user.type(screen.getByLabelText('重量'), '約1.2t')
    await user.type(screen.getByLabelText('希望日'), '相談')
    await user.clear(screen.getByLabelText('報酬（円）'))
    await user.type(screen.getByLabelText('報酬（円）'), '14000')
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'owner@example.com',
    )
    await user.click(screen.getByRole('button', { name: '運搬を依頼する' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(
      screen.getByRole('link', { name: '案件ボードにもどる' }),
    ).toHaveAttribute('href', '/transport')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transport/requests',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
