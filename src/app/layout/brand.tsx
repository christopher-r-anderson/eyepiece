import { css } from 'styled-system/css'
import logo from '@/assets/eyepiece-logo.svg'
import { Link } from '@/components/ui/link'

interface BrandProps {
  // the home masthead page shows the full logotype alone, no mark
  fullWordmark?: boolean
  // when the header carries the search field, the field wins the narrow
  // widths and the wordmark drops (the mark keeps the brand present)
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
          <circle
            cx="12"
            cy="12"
            r="8.75"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
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
