import { z } from 'zod'

// mirrored into the inputs' native maxLength so no-JS submits are told
// about the limit before posting
export const DISPLAY_NAME_MAX_LENGTH = 60

export const profileSchema = z.object({
  id: z.uuidv4(),
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH),
})

export type Profile = z.infer<typeof profileSchema>
