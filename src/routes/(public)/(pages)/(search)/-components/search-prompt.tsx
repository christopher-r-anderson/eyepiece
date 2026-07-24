import { css } from 'styled-system/css'

export function SearchPrompt() {
  return (
    <p
      className={css({
        color: 'text.muted',
        marginBlock: '6',
        maxWidth: 'readingMax',
      })}
    >
      Enter search keywords to see results.
    </p>
  )
}
