// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchRefinements } from './listing-filters'

describe('SearchRefinements', () => {
  it('applies prefecture, layout, price range, sort, and dates', async () => {
    const onChange = vi.fn()
    render(
      <SearchRefinements
        value={{ category: 'すべて', deal: 'rent', keyword: '' }}
        onChange={onChange}
      />,
    )
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('都道府県'), '東京都')
    expect(onChange).toHaveBeenLastCalledWith({ prefecture: '東京都' })
    await user.selectOptions(screen.getByLabelText('間取り'), '2LDK')
    expect(onChange).toHaveBeenLastCalledWith({ layout: '2LDK' })
    await user.selectOptions(
      screen.getByLabelText('並び替え'),
      '月額賃料が安い順',
    )
    expect(onChange).toHaveBeenLastCalledWith({ sort: 'rentAsc' })
    await user.type(screen.getByLabelText('月額賃料の下限'), '100000')
    await user.type(screen.getByLabelText('月額賃料の上限'), '300000')
    await user.click(screen.getByRole('button', { name: '価格で絞り込む' }))
    expect(onChange).toHaveBeenLastCalledWith({
      priceMin: 100_000,
      priceMax: 300_000,
    })
    await user.type(screen.getByLabelText('入居開始日'), '2026-10-01')
    await user.type(screen.getByLabelText('入居終了日'), '2027-09-30')
    expect(onChange).toHaveBeenLastCalledWith({
      availableFrom: '2026-10-01',
      availableTo: '2027-09-30',
    })
  })

  it('labels the price by sale when the deal is not rent and clears refinements', async () => {
    const onChange = vi.fn()
    render(
      <SearchRefinements
        value={{
          category: 'すべて',
          deal: 'sale',
          keyword: '',
          prefecture: '東京都',
          layout: '3LDK',
          priceMax: 50_000_000,
          sort: 'priceAsc',
        }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('販売価格の上限')).toHaveValue('50000000')
    expect(screen.getByLabelText('都道府県')).toHaveValue('東京都')
    expect(screen.getByLabelText('間取り')).toHaveValue('3LDK')
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '絞り込みを解除' }))
    expect(onChange).toHaveBeenLastCalledWith({
      prefecture: undefined,
      layout: undefined,
      priceMin: undefined,
      priceMax: undefined,
      sort: undefined,
      availableFrom: undefined,
      availableTo: undefined,
    })
  })
})
