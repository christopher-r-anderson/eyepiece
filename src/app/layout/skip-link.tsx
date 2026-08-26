import { css } from 'styled-system/css'
import { MAIN_CONTENT_ID } from '@/components/page-main'

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className={css({
        position: 'fixed',
        insetBlockStart: '[-5rem]',
        insetInlineStart: '2',
        zIndex: 'toast',
        paddingBlock: '2',
        paddingInline: '3',
        backgroundColor: 'bg.surface.4',
        color: 'text',
        border: 'default',
        borderRadius: 'sm',
        textDecoration: 'none',
        _focus: {
          insetBlockStart: '2',
          outline: 'focusRing',
          outlineOffset: '[2px]',
        },
      })}
    >
      Skip to main content
    </a>
  )
}
