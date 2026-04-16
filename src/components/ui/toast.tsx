import {
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastContent as RacToastContent,
  UNSTABLE_ToastRegion as RacToastRegion,
  Text,
} from 'react-aria-components'
import { XIcon } from '@phosphor-icons/react/dist/ssr'
import { Button } from './button'
import { toastQueue } from './toast.hooks'
import type { ToastProps } from 'react-aria-components'

export interface ToastContent {
  title: string
  description?: string
}

const regionCss = {
  position: 'fixed' as const,
  bottom: 'var(--space-7)',
  right: 'var(--space-7)',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  gap: 'var(--space-2)',
  maxWidth: 'min(var(--size-reading-max), calc(100vw - (2 * var(--space-7))))',
}

const toastCss = {
  backgroundColor: 'var(--secondary-bg)',
  color: 'var(--secondary-text)',
  outline: '1px solid var(--outline-color)',
  padding: 'var(--space-4)',
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  gap: 'var(--space-2)',
}

const contentCss = {
  display: 'flex' as const,
  flexDirection: 'column' as const,
  gap: 'var(--space-2)',
}

const titleCss = {
  fontWeight: 700,
  lineHeight: 'var(--line-height-tight)',
}

const closeButtonCss = {
  marginInlineStart: 'auto',
  padding: 0,
}

export function ToastRegion() {
  return (
    <RacToastRegion queue={toastQueue} css={regionCss}>
      {({ toast }) => (
        <Toast
          toast={toast}
          style={{ viewTransitionName: toast.key }}
          css={toastCss}
        >
          <RacToastContent css={contentCss}>
            <Text slot="title" css={titleCss}>
              {toast.content.title}
            </Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </RacToastContent>
          <Button slot="close" aria-label="Close" css={closeButtonCss}>
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
