import { css } from 'styled-system/css'
// no-inline: a data-URI asset can't serve an SVG fragment reference
import logo from '@/assets/eyepiece-logo.svg?no-inline'
import mark from '@/assets/eyepiece-mark.svg?no-inline'
import { Link } from '@/components/ui/link'

interface BrandProps {
  // the search field wins the narrow widths; the mark keeps the brand present
  hideWordmarkWhenNarrow?: boolean
}

export function Brand({ hideWordmarkWhenNarrow }: BrandProps) {
  return (
    <Link
      to="/"
      aria-label="eyepiece home"
      css={{
        display: 'flex',
        alignItems: 'center',
        gap: '[10px]',
        flexShrink: 0,
        color: 'text',
        _hovered: { color: 'accent.emphasis', textDecoration: 'none' },
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={css({ display: 'block', flexShrink: 0, color: 'accent' })}
      >
        <use href={`${mark}#mark`} />
      </svg>
      <svg
        role="img"
        aria-label="eyepiece"
        width="72.9"
        height="17"
        viewBox="0 0 198.806 46.365"
        className={css({
          display: 'block',
          overflow: 'visible',
          ...(hideWordmarkWhenNarrow && { mdDown: { display: 'none' } }),
        })}
      >
        <use href={`${logo}#group`} />
      </svg>
    </Link>
  )
}
