// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TransportEstimate } from './transport-estimate'

describe('TransportEstimate', () => {
  it('shows the base rate until a destination is chosen, then distance and fee', async () => {
    render(<TransportEstimate category="単身引越し" fromPrefecture="新潟県" />)
    expect(screen.getByText(/¥30,000〜/)).toBeInTheDocument()
    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText('届け先の都道府県'), '東京都')
    expect(screen.getByText(/約3\d\dkm/)).toBeInTheDocument()
    expect(screen.getByText(/目安 ¥75,000/)).toBeInTheDocument()
  })
})
