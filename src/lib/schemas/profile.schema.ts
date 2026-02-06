import { z } from 'zod'
import { userIdSchema } from './user.schema'

export const displayNameSchema = z.string().trim().min(1).max(60)

export const profileInputSchema = z.object({
  id: userIdSchema,
  displayName: displayNameSchema,
})

export type ProfileInput = z.infer<typeof profileInputSchema>
export type DisplayName = z.infer<typeof displayNameSchema>

export const profileDisplaySchema = z.object({
  id: userIdSchema,
  displayName: displayNameSchema,
})

export type ProfileDisplay = z.infer<typeof profileDisplaySchema>
