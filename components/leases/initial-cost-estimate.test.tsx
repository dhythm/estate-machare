// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { InitialCostEstimate } from './initial-cost-estimate'

describe('InitialCostEstimate', () => {
  it('breaks the move-in cost down and totals it', () => {
    render(
      <InitialCostEstimate
        rentPerMonth={120_000}
        depositMonths={2}
        keyMoneyMonths={1}
      />,
    )
    expect(screen.getByText('敷金（2か月）')).toBeInTheDocument()
    expect(screen.getByText('¥240,000')).toBeInTheDocument()
    expect(screen.getByText('¥600,000')).toBeInTheDocument()
  })

  it('treats missing deposit and key money as zero months', () => {
    render(<InitialCostEstimate rentPerMonth={90_000} />)
    expect(screen.getByText('敷金（0か月）')).toBeInTheDocument()
    expect(screen.getByText('¥180,000')).toBeInTheDocument()
  })

  it('totals the rent over the chosen term', async () => {
    render(<InitialCostEstimate rentPerMonth={100_000} />)
    expect(screen.getByText('期間中の賃料合計（12か月）')).toBeInTheDocument()
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument()
    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText('契約期間'), '24')
    expect(screen.getByText('期間中の賃料合計（24か月）')).toBeInTheDocument()
    expect(screen.getByText('¥2,400,000')).toBeInTheDocument()
  })
})
