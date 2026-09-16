// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ListingForm } from './listing-form'

const { resizeImage, resizeDataUrl } = vi.hoisted(() => ({
  resizeImage: vi.fn(),
  resizeDataUrl: vi.fn(),
}))
vi.mock('@/lib/images', () => ({ resizeImage, resizeDataUrl }))

function setup(
  contact?: { name: string; email: string },
  edit?: Parameters<typeof ListingForm>[0]['edit'],
) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ListingForm contact={contact} edit={edit} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

const existing = {
  listingId: 'apt-001',
  values: {
    name: 'シティタワー 世田谷区 3LDK',
    category: 'マンション',
    zoning: '第一種住居地域',
    layout: '3LDK',
    floorArea: '74.2',
    builtYear: '2019',
    nearestStation: '小田急線 経堂駅',
    walkMinutes: '6',
    prefecture: '東京都',
    city: '世田谷区',
    deals: ['sale', 'rent'] as ('sale' | 'rent')[],
    salePrice: '88000000',
    rentPerMonth: '220000',
    depositMonths: '2',
    keyMoneyMonths: '1',
    leaseType: '普通借家',
    purchaseOption: true,
    purchaseOptionCreditRate: '50',
    purchaseOptionCreditCap: '5000000',
    summary: '南向き角住戸',
    sellerName: '中村不動産',
    sellerKind: '宅建業者',
    contactEmail: 'seller@example.com',
  },
  images: ['data:image/jpeg;base64,one', 'data:image/jpeg;base64,two'],
  thumbnail: 'data:image/jpeg;base64,thumbone',
}

afterEach(() => vi.unstubAllGlobals())

describe('ListingForm', () => {
  it('focuses the first invalid field on submit without moving focus while typing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.click(screen.getByRole('button', { name: '出品を申し込む' }))
    const name = screen.getByLabelText('物件名')
    expect(name).toHaveFocus()
    await user.type(name, 'マンション')
    expect(name).toHaveValue('マンション')
    expect(name).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('edits an existing listing with PUT, keeping remaining pictures', async () => {
    resizeDataUrl.mockResolvedValue('data:image/jpeg;base64,thumbtwo')
    const fetchMock = vi.fn(async () =>
      Response.json({ id: 'apt-001', updatedAt: '2026-09-13T00:00:00.000Z' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup(undefined, existing)
    expect(screen.getByLabelText('物件名')).toHaveValue(
      'シティタワー 世田谷区 3LDK',
    )
    expect(screen.getByLabelText('充当率（%）')).toHaveValue('50')
    expect(screen.getAllByRole('img', { name: /写真/ })).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: '削除' })[0])
    await user.clear(screen.getByLabelText('物件名'))
    await user.type(screen.getByLabelText('物件名'), '更新後の名前')
    await user.click(screen.getByRole('button', { name: '更新する' }))
    expect(await screen.findByRole('status')).toHaveTextContent('更新しました')
    expect(
      screen.getByRole('link', { name: '物件の詳細を見る' }),
    ).toHaveAttribute('href', '/listings/apt-001')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/apt-001',
      expect.objectContaining({ method: 'PUT' }),
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body.name).toBe('更新後の名前')
    expect(body.images).toEqual(['data:image/jpeg;base64,two'])
    expect(body.thumbnail).toBe('data:image/jpeg;base64,thumbtwo')
  })

  it('adds resized pictures, previews them, and submits them with a thumbnail', async () => {
    resizeImage.mockImplementation(async (_file: File, maxSide: number) =>
      maxSide > 500
        ? 'data:image/jpeg;base64,full'
        : 'data:image/jpeg;base64,thumb',
    )
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'r1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup({ name: '出品者デモ', email: 'seller@example.com' })
    const file = new File(['x'], 'apartment.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('写真（5枚まで）'), [file, file])
    expect(await screen.findAllByRole('img', { name: /写真/ })).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: '削除' })[1])
    expect(screen.getAllByRole('img', { name: /写真/ })).toHaveLength(1)

    await user.type(screen.getByLabelText('物件名'), 'パークサイド 杉並区 2LDK')
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    await user.selectOptions(screen.getByLabelText('用途地域'), '商業地域')
    await user.selectOptions(screen.getByLabelText('間取り'), '2LDK')
    await user.type(screen.getByLabelText('専有面積（㎡）'), '58.3')
    await user.type(screen.getByLabelText('築年'), '2018')
    await user.type(screen.getByLabelText('最寄駅'), 'JR中央線 荻窪駅')
    await user.type(screen.getByLabelText('駅徒歩（分）'), '8')
    await user.type(screen.getByLabelText('都道府県'), '東京都')
    await user.type(screen.getByLabelText('市区町村'), '杉並区')
    await user.type(screen.getByLabelText('販売価格'), '36500000')
    await user.type(screen.getByLabelText('月額賃料'), '148000')
    await user.type(screen.getByLabelText('敷金（月数）'), '1')
    await user.type(screen.getByLabelText('礼金（月数）'), '1')
    await user.selectOptions(screen.getByLabelText('借家種別'), '普通借家')
    await user.type(screen.getByLabelText('説明'), 'リノベーション済み。')
    await user.selectOptions(screen.getByLabelText('出品者の区分'), '宅建業者')
    await user.click(screen.getByRole('button', { name: '出品を申し込む' }))
    await screen.findByRole('status')
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body.images).toEqual(['data:image/jpeg;base64,full'])
    expect(body.thumbnail).toBe('data:image/jpeg;base64,thumb')
  })

  it('prefills the seller from the signed-in user', () => {
    setup({ name: '出品者デモ', email: 'seller@example.com' })
    expect(screen.getByLabelText('出品者名')).toHaveValue('出品者デモ')
    expect(screen.getByLabelText('メールアドレス')).toHaveValue(
      'seller@example.com',
    )
  })

  it('asks for credit terms only when purchase-option is enabled', async () => {
    const user = setup()
    expect(screen.queryByLabelText('充当率（%）')).toBeNull()
    await user.click(screen.getByLabelText('買取オプションを付ける'))
    expect(screen.getByLabelText('充当率（%）')).toHaveValue('50')
    expect(screen.getByLabelText('充当上限（円）')).toBeInTheDocument()
  })

  it('only asks for prices of the selected deals', async () => {
    const user = setup()
    expect(screen.getByLabelText('販売価格')).toBeInTheDocument()
    expect(screen.getByLabelText('月額賃料')).toBeInTheDocument()
    await user.click(screen.getByLabelText('売買する'))
    expect(screen.queryByLabelText('販売価格')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('買取オプションを付ける'),
    ).not.toBeInTheDocument()
  })

  it('submits the listing with numbers as entered', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 'r1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.type(screen.getByLabelText('物件名'), 'パークサイド 杉並区 2LDK')
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'マンション')
    await user.selectOptions(screen.getByLabelText('用途地域'), '商業地域')
    await user.selectOptions(screen.getByLabelText('間取り'), '2LDK')
    await user.type(screen.getByLabelText('専有面積（㎡）'), '58.3')
    await user.type(screen.getByLabelText('築年'), '2018')
    await user.type(screen.getByLabelText('最寄駅'), 'JR中央線 荻窪駅')
    await user.type(screen.getByLabelText('駅徒歩（分）'), '8')
    await user.type(screen.getByLabelText('都道府県'), '東京都')
    await user.type(screen.getByLabelText('市区町村'), '杉並区')
    await user.type(screen.getByLabelText('販売価格'), '36500000')
    await user.type(screen.getByLabelText('月額賃料'), '148000')
    await user.type(screen.getByLabelText('敷金（月数）'), '1')
    await user.type(screen.getByLabelText('礼金（月数）'), '1')
    await user.selectOptions(screen.getByLabelText('借家種別'), '普通借家')
    await user.click(screen.getByLabelText('買取オプションを付ける'))
    await user.type(screen.getByLabelText('説明'), 'リノベーション済み。')
    await user.type(screen.getByLabelText('出品者名'), 'テスト不動産')
    await user.selectOptions(screen.getByLabelText('出品者の区分'), '宅建業者')
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'seller@example.com',
    )
    await user.click(screen.getByRole('button', { name: '出品を申し込む' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    expect(
      screen.getByRole('link', { name: '出品中の物件を見る' }),
    ).toHaveAttribute('href', '/listings')
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      name: 'パークサイド 杉並区 2LDK',
      deals: ['sale', 'rent'],
      salePrice: '36500000',
      purchaseOption: true,
      sellerName: 'テスト不動産',
      sellerKind: '宅建業者',
    })
  })
})
