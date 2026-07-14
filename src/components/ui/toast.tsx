import {
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastContent as RacToastContent,
  UNSTABLE_ToastRegion as RacToastRegion,
  Text,
} from 'react-aria-components'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { Button } from './button'
import { toastQueue } from './toast.hooks'
import type { ToastProps } from 'react-aria-components'

export interface ToastContent {
  title: string
  description?: string
}

const regionStyles = css.raw({
  position: 'fixed',
  bottom: '7',
  right: '7',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  maxWidth:
    'min(token(sizes.readingMax), calc(100vw - (2 * token(spacing.7))))',
})

const toastStyles = css.raw({
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  outline: '1px solid token(colors.outline)',
  padding: '4',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
})

const contentStyles = css.raw({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
})

const titleStyles = css.raw({
  fontWeight: 700,
  lineHeight: 'tight',
})

const closeButtonStyles = css.raw({
  marginInlineStart: 'auto',
  padding: 0,
})

export function ToastRegion() {
  return (
    <RacToastRegion queue={toastQueue} className={css(regionStyles)}>
      {({ toast }) => (
        <Toast
          toast={toast}
          style={{ viewTransitionName: toast.key }}
          className={css(toastStyles)}
        >
          <RacToastContent className={css(contentStyles)}>
            <Text slot="title" className={css(titleStyles)}>
              {toast.content.title}
            </Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </RacToastContent>
          <Button slot="close" aria-label="Close" css={closeButtonStyles}>
            <XIcon size={16} />
          </Button>
        </Toast>
      )}
    </RacToastRegion>
  )
}

function Toast(props: ToastProps<ToastContent>) {
  return <RacToast {...props} />
}
