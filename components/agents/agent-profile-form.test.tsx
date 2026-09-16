// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgentProfileForm } from './agent-profile-form'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

afterEach(() => vi.unstubAllGlobals())

describe('AgentProfileForm', () => {
  it('saves vehicles and service areas', async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: 'demo-user' }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AgentProfileForm
        contact={{ name: '利用者デモ', email: 'u@example.com' }}
      />,
    )
    const user = userEvent.setup()
    expect(screen.getByLabelText('お名前・屋号')).toHaveValue('利用者デモ')
    await user.selectOptions(screen.getByLabelText('区分'), '法人')
    await user.selectOptions(screen.getByLabelText('拠点の都道府県'), '秋田県')
    await user.click(screen.getByLabelText('マンション'))
    await user.click(
      screen.getByLabelText('秋田県', { selector: 'input[type="checkbox"]' }),
    )
    await user.click(
      screen.getByLabelText('山形県', { selector: 'input[type="checkbox"]' }),
    )
    await user.click(screen.getByRole('button', { name: '保存する' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agents/profile',
      expect.objectContaining({ method: 'PUT' }),
    )
    expect(
      JSON.parse(
        (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
          .body as string,
      ),
    ).toEqual({
      name: '利用者デモ',
      kind: '法人',
      prefecture: '秋田県',
      handledCategories: ['マンション'],
      serviceAreas: ['秋田県', '山形県'],
      note: '',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('保存しました')
    expect(refresh).toHaveBeenCalled()
  })

  it('starts from an existing profile and validates before posting', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <AgentProfileForm
        initial={{
          name: '高橋運送',
          kind: '法人',
          prefecture: '秋田県',
          handledCategories: ['マンション'],
          serviceAreas: ['秋田県'],
          note: '',
        }}
      />,
    )
    expect(screen.getByLabelText('マンション')).toBeChecked()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('マンション'))
    await user.click(screen.getByRole('button', { name: '保存する' }))
    expect(
      screen.getByText('取扱カテゴリを1つ以上選択してください。'),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
