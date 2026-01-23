import { PASSWORD_MIN_LENGTH } from './set-password-field.schema'
import type { TextFieldProps } from '@/components/ui/forms'
import { TextField } from '@/components/ui/forms'

const PASSWORD_DESCRIPTION = `Use at least ${PASSWORD_MIN_LENGTH} characters.
We recommend a long passphrase (like a favorite sentence) or using a password manager to generate one for you.`

type SetPasswordFieldProps = Omit<TextFieldProps, 'label'> & {
  label?: string
}

export function SetPasswordField({
  description = PASSWORD_DESCRIPTION,
  name = 'password',
  type = 'password',
  autoComplete = 'new-password',
  isRequired = true,
  label = 'Password',
  placeholder = 'Enter your password',
}: SetPasswordFieldProps) {
  return (
    <TextField
      description={description}
      name={name}
      type={type}
      autoComplete={autoComplete}
      isRequired={isRequired}
      label={label}
      placeholder={placeholder}
    />
  )
}
