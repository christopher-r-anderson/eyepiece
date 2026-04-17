import {
  FieldError,
  Input,
  Label,
  Form as RacForm,
  TextField as RacTextField,
  Text,
} from 'react-aria-components'
import { useId } from 'react-aria'
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr'
import { COMPACT_LAYOUT_MIN_WIDTH } from '../../lib/breakpoints'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from './stable-visibility-stack'
import { ToggleButton } from './toggle-button'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { Interpolation, Theme } from '@emotion/react'
import type {
  FormProps as RacFormProps,
  TextFieldProps as RacTextFieldProps,
} from 'react-aria-components'

export { FieldError, Input, Label }

export type { FormState, FormErrorState } from './forms.types'

export function FormError({ error }: { error?: string }) {
  if (error) {
    return <p>{error}</p>
  }
}
export type FormProps = {
  formError?: string
  controls?: React.ReactNode
  surface?: 'plain' | 'panel'
  css?: Interpolation<Theme>
} & RacFormProps

export const COMPACT_FORM_ACTIONS_MIN_WIDTH = '40rem'

export const formActionsCss = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginBlockStart: 'var(--space-4)',
}

export const formActionButtonCss = {
  width: '100%',
  [`@container (min-width: ${COMPACT_FORM_ACTIONS_MIN_WIDTH})`]: {
    width: 'auto',
  },
}

export const formStatusPanelCss = {
  width: '100%',
  maxWidth: '32rem',
  display: 'grid',
  gap: 'var(--space-3)',
}

const formCss = {
  width: '100%',
  padding: 'var(--space-4)',
  margin: '0 auto',
  containerType: 'inline-size' as const,
}

const panelFormCss = {
  ...formCss,
  padding: 'var(--space-5)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--secondary-bg)',
  boxShadow: 'var(--shadow-sm)',
}

export function Form({
  children,
  css: cssProp,
  formError,
  controls,
  surface = 'plain',
  ...props
}: FormProps) {
  return (
    <RacForm
      {...props}
      css={[surface === 'panel' ? panelFormCss : formCss, cssProp]}
    >
      {children}
      {formError && <FormError error={formError} />}
      {controls}
    </RacForm>
  )
}

export function FormStatusSwitcher({
  showStatus,
  status,
  children,
}: {
  showStatus: boolean
  status: ReactNode
  children: ReactNode
}) {
  return (
    <StableVisibilityStack activeKey={showStatus ? 'status' : 'form'}>
      <StableVisibilityStackItem itemKey="form">
        {children}
      </StableVisibilityStackItem>
      <StableVisibilityStackItem
        itemKey="status"
        role="status"
        aria-live="polite"
        align="center"
      >
        {status}
      </StableVisibilityStackItem>
    </StableVisibilityStack>
  )
}

export function InputGroup(props: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      css={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        rowGap: 'var(--space-4)',
        [`@container (min-width: ${COMPACT_LAYOUT_MIN_WIDTH})`]: {
          gridTemplateColumns: 'auto minmax(10ch, 30ch)',
          columnGap: 'var(--space-3)',
          rowGap: 'var(--space-5)',
        },
      }}
    />
  )
}

export type TextFieldProps = {
  description?: string
  label: string
  placeholder?: string
} & RacTextFieldProps

export function TextField({
  description,
  label,
  placeholder,
  type,
  ...props
}: TextFieldProps) {
  const inputId = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPasswordField = type === 'password'
  const actualType = isPasswordField
    ? showPassword
      ? 'text'
      : 'password'
    : type
  return (
    <RacTextField
      id={inputId}
      type={actualType}
      css={{
        gridColumn: '1 / -1',
        display: 'grid',
        gridTemplateColumns: 'subgrid',
        minWidth: 0,
      }}
      {...props}
    >
      <Label css={{ textAlign: 'left' }}>{label}</Label>
      <div css={{ display: 'flex', minWidth: 0 }}>
        <Input
          placeholder={placeholder}
          css={{ width: '100%', maxWidth: '100%' }}
          style={isPasswordField ? {} : undefined}
        />
        {isPasswordField && (
          <ToggleButton
            aria-label="Toggle password visibility"
            aria-controls={inputId}
            variant="icon"
            css={{
              display: 'flex',
              alignItems: 'center',
              '--toggle-icon-color': 'var(--text-muted)',
              '--toggle-icon-hover-color': 'var(--text)',
              '--toggle-icon-selected-color': 'var(--text-accent)',
              '--toggle-icon-selected-glow': 'transparent',
            }}
            isSelected={showPassword}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
          </ToggleButton>
        )}
      </div>
      {description && (
        <Text
          slot="description"
          css={{
            fontSize: 'var(--text-xs)',
            marginTop: 'var(--space-2)',
            gridColumn: '1 / -1',
          }}
        >
          {description}
        </Text>
      )}
      <FieldError
        css={{
          color: 'var(--danger-text)',
          fontSize: 'var(--text-sm)',
          gridColumn: '1 / -1',
          paddingBlockStart: 'var(--space-2)',
        }}
      />
    </RacTextField>
  )
}
