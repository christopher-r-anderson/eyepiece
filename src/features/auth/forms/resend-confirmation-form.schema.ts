import { z } from 'zod'

// the fields both submit paths validate: the client action uses this bare,
// the server form action extends it with its routing params
export const resendConfirmationFormSchema = z.object({
  email: z.email(),
  redirectTo: z.url(),
})
