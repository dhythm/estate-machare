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
          rx="2"
          fill={inverse ? '#e1c5ab' : '#203a43'}
        />
        <path
          d="M9 18 20 9l11 9v13H9V18Z M17 31V20h6v11"
          stroke={inverse ? '#203a43' : '#e1c5ab'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 35h28"
          stroke={inverse ? '#203a43' : '#e1c5ab'}
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
            住まいと、次の可能性を。
          </span>
        </span>
      )}
    </span>
  )
}
