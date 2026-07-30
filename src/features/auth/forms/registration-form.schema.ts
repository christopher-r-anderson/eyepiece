import { z } from 'zod'
import { setPasswordFieldSchema } from './components/set-password-field.schema'
import { profileSchema } from '@/domain/profile/profile.schema'

// the fields both submit paths validate: the client action uses this bare,
// the server form action extends it with its routing params
export const registrationFormSchema = z.object({
  email: z.email(),
  displayName: profileSchema.shape.displayName,
  password: setPasswordFieldSchema,
  redirectTo: z.url(),
})
