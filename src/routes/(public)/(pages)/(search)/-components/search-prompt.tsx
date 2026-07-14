import { css } from 'styled-system/css'

export function SearchPrompt() {
  return (
    <p
      className={css({
        textAlign: 'center',
        marginBlock: '7',
        marginInline: '0',
      })}
    >
      Enter search keywords to see results.
    </p>
  )
}
