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
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from './stable-visibility-stack'
import { ToggleButton } from './toggle-button'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { SystemStyleObject } from 'styled-system/types'
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
  css?: SystemStyleObject
  className?: string
} & RacFormProps

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

const formStyles = css.raw({
  width: '100%',
  padding: '4',
  margin: '0 auto',
  containerType: 'inline-size',
})

const panelFormStyles = css.raw({
  ...formStyles,
  padding: '5',
  border: 'default',
  borderRadius: 'lg',
  backgroundColor: 'secondary.bg',
  boxShadow: 'sm',
})

const textFieldControlStyles = css.raw({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  minHeight: 'controlHeight',
  paddingInline: '3',
  gap: '2',
  borderRadius: 'md',
  border:
    '1px solid color-mix(in oklab, token(colors.border) 88%, token(colors.text) 12%)',
  backgroundColor: 'secondary.bg',
  color: 'secondary.text',
  boxShadow: 'sm',
  transitionFast: 'border-color, outline-color',
  _focusWithin: {
    outline: 'focusRing',
    outlineOffset: '1px',
  },
})

const textFieldInputStyles = css.raw({
  width: '100%',
  minWidth: 0,
  minHeight: 'calc(token(sizes.controlHeight) - 2px)',
  paddingBlock: '2',
  border: 0,
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'inherit',
  caretColor: 'currentColor',
  '&:focus': {
    outline: 'none',
  },
  _placeholder: {
    color: 'text.muted',
  },
  _autofill: {
    boxShadow: 'inset 0 0 0 100px token(colors.secondary.bg)',
    WebkitTextFillColor: 'token(colors.secondary.text)',
  },
})

export function Form({
  children,
  css: cssProp,
  className,
  formError,
  controls,
  surface = 'plain',
  ...props
}: FormProps) {
  return (
    <RacForm
      {...props}
      className={cx(
        css(surface === 'panel' ? panelFormStyles : formStyles, cssProp),
        className,
      )}
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
        css({
          display: 'grid',
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
  className?: string
} & RacTextFieldProps

export function TextField({
  description,
  label,
  placeholder,
  type,
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
      className={cx(
        css({
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: 'subgrid',
          minWidth: 0,
        }),
        className,
      )}
      {...props}
    >
      <Label className={css({ textAlign: 'left' })}>{label}</Label>
      <div className={css(textFieldControlStyles)}>
        <Input
          placeholder={placeholder}
          className={css(textFieldInputStyles, { maxWidth: '100%' })}
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
        <Text
          slot="description"
          className={css({
            fontSize: 'xs',
            marginTop: '2',
            gridColumn: '1 / -1',
          })}
        >
          {description}
        </Text>
      )}
      <FieldError
        className={css({
          color: 'danger.text',
          fontSize: 'sm',
          gridColumn: '1 / -1',
          paddingBlockStart: '2',
        })}
      />
    </RacTextField>
  )
}
