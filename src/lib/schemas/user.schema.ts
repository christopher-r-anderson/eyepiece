import { z } from 'zod'

export const userIdSchema = z.uuidv4()

export type UserId = z.infer<typeof userIdSchema>
