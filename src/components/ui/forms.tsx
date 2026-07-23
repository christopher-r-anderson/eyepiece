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
import type { UiProps } from './style-contract'
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

export const formStatusPanelCss = css.raw({
  width: '100%',
  maxWidth: 'formMax',
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
  layout,
  ...props
}: FormProps) {
  return (
    <RacForm
      {...props}
      className={cx(form({ surface, layout }), css(cssProp), className)}
    >
      {children}
      {formError && <FormError error={formError} />}
      {controls}
    </RacForm>
  )
}

// stacked full-width actions; inside a page-layout form with room they
// collapse to an end-aligned row of intrinsic widths
export function FormActions({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cx(
        grid({
          gap: '3',
          alignItems: 'center',
          '@form/2xl': {
            gridAutoFlow: 'column',
            gridTemplateColumns: 'none',
            justifyContent: 'flex-end',
          },
        }),
        className,
      )}
    />
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
      <StableVisibilityStackItem itemKey="form" className={grid({ gap: '4' })}>
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
          '@form/2xl': {
            gridTemplateColumns: 'auto minmax(6rem, 17rem)',
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
        <Input placeholder={placeholder} className={textFieldSlots.input} />
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
              '--toggle-icon-selected-color': 'token(colors.accent.emphasis)',
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
