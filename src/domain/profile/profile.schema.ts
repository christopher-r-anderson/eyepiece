import { z } from 'zod'

export const profileSchema = z.object({
  id: z.uuidv4(),
  displayName: z.string().trim().min(1).max(60),
})

export type Profile = z.infer<typeof profileSchema>
