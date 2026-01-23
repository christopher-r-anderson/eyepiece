import type { ZodType, z } from 'zod'
import type { Result } from '@/features/auth/types'

// NOTE: Note the supported types - only strings - no blobs/file, no arrays!
export type FormDataObject = Record<PropertyKey, string | undefined>

export type ErrorMessages<T extends ZodType> = {
  [K in keyof z.infer<T>]?: Array<string>
}

export type FormErrorState<T extends ZodType> = {
  status: 'validation-error'
  formDataObject: FormDataObject
  hasErrors: true
  errors?: Array<string>
  fieldErrors?: ErrorMessages<T>
}

export type ActionErrorState<T extends ZodType> = {
  status: 'action-error'
  hasErrors: true
  formDataObject: FormDataObject
  data: z.infer<T>
  errors?: Array<string>
}

export type FormIdleState = { status: 'idle'; hasErrors: false }

export type FormSuccessState = { status: 'success'; hasErrors: false }

export type FormState<T extends ZodType> =
  | FormErrorState<T>
  | ActionErrorState<T>
  | FormIdleState
  | FormSuccessState

export type Action<TSchema extends ZodType> = (
  data: z.infer<TSchema>,
) => Promise<Result<void>>
