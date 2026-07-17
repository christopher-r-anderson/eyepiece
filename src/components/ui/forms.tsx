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
import { css, cx } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import { form, textField } from 'styled-system/recipes'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from './stable-visibility-stack'
import { ToggleButton } from './toggle-button'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { FormVariantProps } from 'styled-system/recipes'
import type { UiProps } from './style-props'
import type {
  FormProps as RacFormProps,
  TextFieldProps as RacTextFieldProps,
} from 'react-aria-components'

const textFieldSlots = textField()

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
} & FormVariantProps &
  UiProps<RacFormProps>

export const formActionsCss = css.raw({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '3',
  marginBlockStart: '4',
})

export const formActionButtonCss = css.raw({
  width: '100%',
  '@/2xl': {
    width: 'auto',
  },
})

export const formStatusPanelCss = css.raw({
  width: '100%',
  maxWidth: '32rem',
  display: 'grid',
  gap: '3',
})

export function Form({
  children,
  css: cssProp,
  className,
  formError,
  controls,
  surface,
  ...props
}: FormProps) {
  return (
    <RacForm
      {...props}
      className={cx(form({ surface }), css(cssProp), className)}
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

export function InputGroup({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cx(
        grid({
          gridTemplateColumns: 'minmax(0, 1fr)',
          rowGap: '4',
          '@/2xl': {
            gridTemplateColumns: 'auto minmax(10ch, 30ch)',
            columnGap: '3',
            rowGap: '5',
          },
        }),
        className,
      )}
    />
  )
}

export type TextFieldProps = {
  description?: string
  label: string
  placeholder?: string
} & UiProps<RacTextFieldProps>

export function TextField({
  description,
  label,
  placeholder,
  type,
  css: cssProp,
  className,
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
      {...props}
      className={cx(textFieldSlots.root, css(cssProp), className)}
    >
      <Label className={textFieldSlots.label}>{label}</Label>
      <div className={textFieldSlots.control}>
        <Input
          placeholder={placeholder}
          className={textFieldSlots.input}
          style={isPasswordField ? {} : undefined}
        />
        {isPasswordField && (
          <ToggleButton
            aria-label="Toggle password visibility"
            aria-controls={inputId}
            variant="icon"
            css={css.raw({
              display: 'flex',
              alignItems: 'center',
              '--toggle-icon-color': 'token(colors.text.muted)',
              '--toggle-icon-hover-color': 'token(colors.text)',
              '--toggle-icon-selected-color': 'token(colors.text.accent)',
              '--toggle-icon-selected-glow': 'transparent',
            })}
            isSelected={showPassword}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
          </ToggleButton>
        )}
      </div>
      {description && (
        <Text slot="description" className={textFieldSlots.description}>
          {description}
        </Text>
      )}
      <FieldError className={textFieldSlots.error} />
    </RacTextField>
  )
}
