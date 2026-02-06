import type { ZodType, z } from 'zod'
import type { ErrorCode, Result } from '@/lib/result'

// NOTE: Note the supported types - only strings - no blobs/file, no arrays!
export type FormDataObject = Record<PropertyKey, string | undefined>

export type ErrorMessages<T extends ZodType> = {
  [K in keyof z.infer<T>]?: string
}

export type FormIdleState = {
  status: 'idle'
  hasErrors: false
  formData: FormDataObject
  // give error props to all types so they can be passed into forms in any state
  error: undefined
  fieldErrors: undefined
}

export type FormProcessingState = {
  status: 'processing'
  hasErrors: false
  formData: FormDataObject
  error: undefined
  fieldErrors: undefined
}

export type FormErrorState<T extends ZodType> = {
  status: 'form-error'
  hasErrors: true
  formData: FormDataObject
  error?: string
  fieldErrors?: ErrorMessages<T>
}

export type ActionErrorState<T extends ZodType> = {
  status: 'action-error'
  hasErrors: true
  formData: FormDataObject
  error?: string
  fieldErrors: undefined
  data: z.infer<T>
}

export type FormSuccessState = {
  status: 'success'
  hasErrors: false
  formData?: FormDataObject
  error: undefined
  fieldErrors: undefined
}

export type FormState<T extends ZodType> =
  | FormIdleState
  | FormProcessingState
  | FormErrorState<T>
  | ActionErrorState<T>
  | FormSuccessState

export const createFormState = {
  idle: (formData: FormDataObject = {}): FormIdleState => ({
    status: 'idle',
    hasErrors: false,
    formData,
    error: undefined,
    fieldErrors: undefined,
  }),
  processing: (formData: FormDataObject): FormProcessingState => ({
    status: 'processing',
    hasErrors: false,
    formData,
    error: undefined,
    fieldErrors: undefined,
  }),
  formError: <T extends ZodType>(
    formData: FormDataObject,
    error?: string,
    fieldErrors?: ErrorMessages<T>,
  ): FormErrorState<T> => ({
    status: 'form-error',
    hasErrors: true,
    formData,
    error,
    fieldErrors,
  }),
  actionError: <T extends ZodType>(
    formData: FormDataObject,
    data: z.infer<T>,
    error?: string,
  ): ActionErrorState<T> => ({
    status: 'action-error',
    hasErrors: true,
    fieldErrors: undefined,
    formData,
    data,
    error,
  }),
  success: (formData?: FormDataObject): FormSuccessState => ({
    status: 'success',
    hasErrors: false,
    formData,
    error: undefined,
    fieldErrors: undefined,
  }),
}

export type Action<
  TSchema extends ZodType,
  TResultData,
  TErrorCode extends ErrorCode = undefined,
> = (data: z.infer<TSchema>) => Promise<Result<TResultData, TErrorCode>>
