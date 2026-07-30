import { z } from 'zod'
import { setPasswordFieldSchema } from './components/set-password-field.schema'

// the fields both submit paths validate: the client action uses this bare,
// the server form action extends it with its routing params
export const updatePasswordFormSchema = z.object({
  password: setPasswordFieldSchema,
})
