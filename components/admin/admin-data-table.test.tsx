// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AdminDataTable } from './admin-data-table'

describe('AdminDataTable', () => {
  it('searches every row while preserving the table and its available actions', async () => {
    render(
      <AdminDataTable
        title="アカウント"
        headers={['名前', '操作']}
        rows={[
          {
            key: 'one',
            searchText: '高橋農園 farm@example.com',
            cells: ['高橋農園', <button key="one">停止する</button>],
          },
          {
            key: 'two',
            searchText: '田中農園 tanaka@example.com',
            cells: ['田中農園', <button key="two">停止を解除</button>],
          },
        ]}
      />,
    )
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('searchbox', { name: 'アカウントを検索' }),
      'FARM@',
    )
    expect(screen.getByText('高橋農園')).toBeInTheDocument()
    expect(screen.queryByText('田中農園')).not.toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: 'アカウント' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '停止する' })).toBeInTheDocument()
    await user.clear(
      screen.getByRole('searchbox', { name: 'アカウントを検索' }),
    )
    expect(screen.getByText('田中農園')).toBeInTheDocument()
  })

  it('keeps the search available when no rows match', async () => {
    render(
      <AdminDataTable
        title="担当者"
        headers={['名前']}
        rows={[{ key: 'one', searchText: '高橋運送', cells: ['高橋運送'] }]}
      />,
    )
    await userEvent
      .setup()
      .type(screen.getByRole('searchbox', { name: '担当者を検索' }), '東京')
    expect(screen.getByText('該当なし')).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: '担当者を検索' }),
    ).toBeInTheDocument()
  })
})
