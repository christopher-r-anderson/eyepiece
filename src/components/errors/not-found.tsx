import { css } from 'styled-system/css'

export function NotFound({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div>
      <h1 className={css({ textStyle: 'display.md' })}>{title}</h1>
      <p
        className={css({
          marginTop: '2',
          color: 'text.muted',
          maxWidth: 'readingMax',
        })}
      >
        {message}
      </p>
    </div>
  )
}
