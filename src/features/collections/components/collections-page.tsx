import { css } from 'styled-system/css'

export function CollectionsPage() {
  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '6',
      })}
    >
      <h1 className={css({ color: 'text.accent' })}>Collections</h1>
    </div>
  )
}
