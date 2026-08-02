import { css } from 'styled-system/css'
import logo from '@/assets/eyepiece-logo.svg'
import { Link } from '@/components/ui/link'

interface BrandProps {
  fullWordmark?: boolean
  // the search field wins the narrow widths; the mark keeps the brand present
  hideWordmarkWhenNarrow?: boolean
}

export function Brand({ fullWordmark, hideWordmarkWhenNarrow }: BrandProps) {
  return (
    <Link
      to="/"
      aria-label="eyepiece home"
      css={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        color: 'text',
        _hovered: { color: 'accent.emphasis', textDecoration: 'none' },
      }}
    >
      {!fullWordmark && (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={css({ display: 'block', flexShrink: 0, color: 'accent' })}
        >
          <path
            d="M 4.6 19.4 L 9.58 17.08 L 6.92 14.42 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M 11.15 5.35 L 4.6 19.4 L 18.65 12.85 Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <svg
        role="img"
        aria-label="eyepiece"
        viewBox="0 0 198.806 46.365"
        className={css({
          display: 'block',
          width: 'auto',
          height: fullWordmark ? '22px' : '17px',
          overflow: 'visible',
          ...(hideWordmarkWhenNarrow && { mdDown: { display: 'none' } }),
        })}
      >
        <use href={`${logo}#group`} />
      </svg>
    </Link>
  )
}
