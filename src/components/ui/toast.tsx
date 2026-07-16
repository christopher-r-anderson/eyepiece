import {
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastContent as RacToastContent,
  UNSTABLE_ToastRegion as RacToastRegion,
  Text,
} from 'react-aria-components'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { css } from 'styled-system/css'
import { toast as toastRecipe } from 'styled-system/recipes'
import { Button } from './button'
import { toastQueue } from './toast.hooks'
import type { ToastProps } from 'react-aria-components'

export interface ToastContent {
  title: string
  description?: string
}

export function ToastRegion() {
  return (
    <RacToastRegion queue={toastQueue} className={toastRecipe().region}>
      {({ toast }) => (
        <Toast
          toast={toast}
          style={{ viewTransitionName: toast.key }}
          className={toastRecipe().root}
        >
          <RacToastContent className={toastRecipe().content}>
            <Text slot="title" className={toastRecipe().title}>
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
