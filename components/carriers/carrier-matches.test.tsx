// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CarrierMatches } from './carrier-matches'

describe('CarrierMatches', () => {
  it('lists matching carriers with their vehicles and areas', () => {
    render(
      <CarrierMatches
        matches={[
          {
            score: 2,
            profile: {
              id: 'demo-user',
              name: '高橋運送',
              kind: '法人',
              prefecture: '秋田県',
              vehicles: ['2tトラック', '4tトラック'],
              serviceAreas: ['秋田県', '山形県'],
              createdAt: '2026-09-13T00:00:00.000Z',
              updatedAt: '2026-09-13T00:00:00.000Z',
            },
          },
        ]}
      />,
    )
    expect(screen.getByText('高橋運送')).toBeInTheDocument()
    expect(screen.getByText('2tトラック・4tトラック')).toBeInTheDocument()
    expect(screen.getByText('秋田県・山形県')).toBeInTheDocument()
    expect(screen.getByText('出発地と届け先の両方に対応')).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<CarrierMatches matches={[]} />)
    expect(
      screen.getByText('対応地域が合う引越しパートナーはまだいません'),
    ).toBeInTheDocument()
  })
})
