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

const slots = toastRecipe()

export interface ToastContent {
  title: string
  description?: string
}

export function ToastRegion() {
  return (
    <RacToastRegion queue={toastQueue} className={slots.region}>
      {({ toast }) => (
        <RacToast toast={toast} className={slots.root}>
          <RacToastContent className={slots.content}>
            <Text slot="title" className={slots.title}>
              {toast.content.title}
            </Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </RacToastContent>
          <Button
            slot="close"
            aria-label="Close"
            variant="bare"
            css={css.raw({
              marginInlineStart: 'auto',
              width: 'touchTargetMin',
              height: 'touchTargetMin',
              flexShrink: 0,
              color: 'text',
              opacity: 0.8,
              transitionFast: 'background-color, color, opacity',
              _hovered: {
                backgroundColor: 'bg.surface.3',
                opacity: 1,
              },
              '&[data-focus-visible], &[data-pressed]': {
                opacity: 1,
              },
              _focusVisible: {
                outlineOffset: '2px',
              },
            })}
          >
            <XIcon aria-hidden="true" size={16} />
          </Button>
        </RacToast>
      )}
    </RacToastRegion>
  )
}
