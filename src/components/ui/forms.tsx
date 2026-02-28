import {
  FieldError,
  Input,
  Label,
  Form as RacForm,
  TextField as RacTextField,
  Text,
  ToggleButton,
} from 'react-aria-components'
import { useId } from 'react-aria'
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr'
import {
  StableVisibilityStack,
  StableVisibilityStackItem,
} from './stable-visibility-stack'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
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
} & RacFormProps

export function Form({ children, formError, controls, ...props }: FormProps) {
  return (
    <RacForm
      {...props}
      css={{
        padding: '1rem',
        margin: '0 auto',
      }}
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
        gridTemplateColumns: 'auto minmax(10ch, 30ch)',
        columnGap: '0.75rem',
        rowGap: '1.5rem',
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
      }}
      {...props}
    >
      <Label css={{ textAlign: 'left' }}>{label}</Label>
      <div css={{ display: 'flex' }}>
        <Input
          placeholder={placeholder}
          css={{ width: '100%', maxWidth: '100%' }}
          style={isPasswordField ? {} : undefined}
        />
        {isPasswordField && (
          <ToggleButton
            aria-label="Toggle password visibility"
            aria-controls={inputId}
            css={{ display: 'flex', alignItems: 'center' }}
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
            fontSize: '0.75rem',
            marginTop: '0.5rem',
            gridColumn: '1 / -1',
          }}
        >
          {description}
        </Text>
      )}
      <FieldError
        css={{
          color: 'red',
          fontSize: '0.85rem',
          gridColumn: '1 / -1',
          paddingBlockStart: '0.5em',
        }}
      />
    </RacTextField>
  )
}
