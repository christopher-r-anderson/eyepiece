import { z } from 'zod'

// the fields both submit paths validate: the client action uses this bare,
// the server form action extends it with its routing params
export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string(),
})
