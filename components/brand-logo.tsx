import { cn } from '@/lib/utils'

export function BrandLogo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2.5',
        inverse ? 'text-white' : 'text-primary',
      )}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="size-9 shrink-0"
        aria-hidden="true"
      >
        <rect
          width="40"
          height="40"
          rx="12"
          fill={inverse ? '#D9EB8B' : '#173F35'}
        />
        <path
          d="M10 29 20 10l10 19M15 23h10"
          stroke={inverse ? '#173F35' : '#D9EB8B'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 33h18"
          stroke={inverse ? '#173F35' : '#D9EB8B'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="flex flex-col">
          <span className="text-[18px] font-bold leading-none tracking-[-0.055em] sm:text-[21px]">
            Estate Machare<span className="ml-0.5 text-xs">.</span>
          </span>
          <span
            className={cn(
              'mt-1.5 text-[9px] font-medium tracking-[0.16em]',
              inverse ? 'text-white/65' : 'text-muted-foreground',
            )}
          >
            不動産と、次の可能性を。
          </span>
        </span>
      )}
    </span>
  )
}
