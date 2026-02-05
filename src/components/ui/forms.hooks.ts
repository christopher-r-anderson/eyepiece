import { useActionState } from 'react'
import { z } from 'zod'
import type { Action, FormErrorState, FormState } from './forms.types'
import type { ZodError, ZodType } from 'zod'
import { resultIsError } from '@/lib/result'

export function useActionForm<TSchema extends ZodType>(
  schema: TSchema,
  action: Action<TSchema>,
) {
  const formAction = async function formAction(
    _previousState: FormState<TSchema>,
    formData: FormData,
  ): Promise<FormState<TSchema>> {
    const validation = schema.safeParse(Object.fromEntries(formData))
    if (!validation.success) {
      const { formError, fieldErrors } = extractZodErrors(validation.error)
      const response: FormErrorState<TSchema> = {
        status: 'validation-error',
        hasErrors: true,
        error: formError,
        fieldErrors,
        formDataObject: dropBlobs(Object.fromEntries(formData.entries())),
      }
      return response
    }

    const result = await action(validation.data)
    if (resultIsError(result)) {
      return {
        status: 'action-error',
        hasErrors: true,
        error: result.error.message,
        data: validation.data,
        formDataObject: dropBlobs(Object.fromEntries(formData.entries())),
      }
    }
    return { status: 'success', hasErrors: false }
  }
  return useActionState(formAction, {
    status: 'idle',
    hasErrors: false,
  } as FormState<TSchema>)
}

export function useDerivedFormState<TSchema extends ZodType>(
  state: FormState<TSchema>,
) {
  switch (state.status) {
    case 'idle':
      return {
        fieldErrors: {},
        formError: '',
        values: {},
      }
    case 'success':
      return {
        fieldErrors: {},
        formError: '',
        values: {},
      }
    case 'validation-error':
      return {
        fieldErrors: state.fieldErrors,
        formError: state.error,
        values: state.formDataObject,
      }
    case 'action-error':
      return {
        fieldErrors: {},
        formError: state.error,
        values: state.formDataObject,
      }
  }
}

function dropBlobs(
  formRecords: Record<string, FormDataEntryValue>,
): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(formRecords)) {
    if (typeof value === 'string') {
      output[key] = value
    }
  }
  return output
}

function extractZodErrors(zodError: ZodError): {
  formError: string
  fieldErrors: Record<string, string>
} {
  const flattenedErrors = z.flattenError(zodError)
  const error = {
    formError: flattenedErrors.formErrors[0],
    fieldErrors: {} as Record<string, string>,
  }
  Object.entries(flattenedErrors.fieldErrors).forEach(([key, value]) => {
    if (
      value &&
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'string'
    ) {
      error.fieldErrors[key] = value[0]
    }
  })
  return error
}
