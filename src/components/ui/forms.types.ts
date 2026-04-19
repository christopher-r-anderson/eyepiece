import type { z } from 'zod'
import type { ErrorCode, Result } from '@/lib/result'

export type FormSchema = z.ZodObject

// NOTE: Note the supported types - only strings - no blobs/file, no arrays!
export type FormDataObject = Record<PropertyKey, string | undefined>

export type ErrorMessages<T extends FormSchema> = {
  [K in keyof z.infer<T>]?: string
}

export type FormIdleState = {
  status: 'idle'
  hasErrors: false
  formData: FormDataObject
  // give error props to all types so they can be passed into forms in any state
  error: undefined
  code: undefined
  fieldErrors: undefined
}

export type FormProcessingState = {
  status: 'processing'
  hasErrors: false
  formData: FormDataObject
  error: undefined
  code: undefined
  fieldErrors: undefined
}

export type FormErrorState<T extends FormSchema> = {
  status: 'form-error'
  hasErrors: true
  formData: FormDataObject
  error?: string
  code: undefined
  fieldErrors?: ErrorMessages<T>
}

export type ActionErrorState<
  T extends FormSchema,
  TErrorCode extends ErrorCode = undefined,
> = {
  status: 'action-error'
  hasErrors: true
  formData: FormDataObject
  error?: string
  code: TErrorCode
  fieldErrors?: ErrorMessages<T>
  data: z.infer<T>
}

export type FormSuccessState = {
  status: 'success'
  hasErrors: false
  formData?: FormDataObject
  error: undefined
  code: undefined
  fieldErrors: undefined
}

export type FormState<
  T extends FormSchema,
  TErrorCode extends ErrorCode = undefined,
> =
  | FormIdleState
  | FormProcessingState
  | FormErrorState<T>
  | ActionErrorState<T, TErrorCode>
  | FormSuccessState

export type ClientActionResultError<
  T extends FormSchema,
  TErrorCode extends ErrorCode = undefined,
> = {
  message: string
  code: TErrorCode
  fieldErrors?: ErrorMessages<T>
}

export const createFormState = {
  idle: (formData: FormDataObject = {}): FormIdleState => ({
    status: 'idle',
    hasErrors: false,
    formData,
    error: undefined,
    code: undefined,
    fieldErrors: undefined,
  }),
  processing: (formData: FormDataObject): FormProcessingState => ({
    status: 'processing',
    hasErrors: false,
    formData,
    error: undefined,
    code: undefined,
    fieldErrors: undefined,
  }),
  formError: <T extends FormSchema>(
    formData: FormDataObject,
    error?: string,
    fieldErrors?: ErrorMessages<T>,
  ): FormErrorState<T> => ({
    status: 'form-error',
    hasErrors: true,
    formData,
    error,
    code: undefined,
    fieldErrors,
  }),
  actionError: <T extends FormSchema, TErrorCode extends ErrorCode = undefined>(
    formData: FormDataObject,
    data: z.infer<T>,
    actionError: ClientActionResultError<T, TErrorCode>,
  ): ActionErrorState<T, TErrorCode> => ({
    status: 'action-error',
    hasErrors: true,
    fieldErrors: actionError.fieldErrors,
    formData,
    data,
    error: actionError.message,
    code: actionError.code,
  }),
  success: (formData?: FormDataObject): FormSuccessState => ({
    status: 'success',
    hasErrors: false,
    formData,
    error: undefined,
    code: undefined,
    fieldErrors: undefined,
  }),
}

export type Action<
  TSchema extends FormSchema,
  TResultData,
  TErrorCode extends ErrorCode = undefined,
> = (data: z.infer<TSchema>) => Promise<Result<TResultData, TErrorCode>>
