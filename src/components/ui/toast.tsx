import {
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastContent as RacToastContent,
  UNSTABLE_ToastRegion as RacToastRegion,
  Text,
} from 'react-aria-components'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { flex, stack } from 'styled-system/patterns'
import { Button } from './button'
import { toastQueue } from './toast.hooks'
import type { ToastProps } from 'react-aria-components'

export interface ToastContent {
  title: string
  description?: string
}

export function ToastRegion() {
  return (
    <RacToastRegion
      queue={toastQueue}
      className={stack({
        position: 'fixed',
        bottom: '7',
        right: '7',
        gap: '2',
        maxWidth:
          'min(token(sizes.readingMax), calc(100vw - (2 * token(spacing.7))))',
      })}
    >
      {({ toast }) => (
        <Toast
          toast={toast}
          style={{ viewTransitionName: toast.key }}
          className={flex({
            align: 'flex-start',
            gap: '2',
            backgroundColor: 'secondary.bg',
            color: 'secondary.text',
            // decorative surface outline, deliberately not the focusRing border token
            outline: '1px solid token(colors.outline)',
            padding: '4',
          })}
        >
          <RacToastContent className={stack({ gap: '2' })}>
            <Text
              slot="title"
              className={css({ fontWeight: 700, lineHeight: 'tight' })}
            >
              {toast.content.title}
            </Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </RacToastContent>
          <Button
            slot="close"
            aria-label="Close"
            css={css.raw({ marginInlineStart: 'auto', padding: 0 })}
          >
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
