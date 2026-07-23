import { css } from 'styled-system/css'
import { Heading } from '@/components/ui/heading'

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
      <Heading level={1} css={css.raw({ color: 'accent.emphasis' })}>
        Collections
      </Heading>
    </div>
  )
}
