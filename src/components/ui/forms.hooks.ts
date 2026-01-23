import { useActionState } from 'react'
import { z } from 'zod'
import type { Action, FormErrorState, FormState } from './forms.types'
import type { ZodType } from 'zod'
import { resultIsError } from '@/features/auth/types'

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
      const { formErrors, fieldErrors } = z.flattenError(validation.error)
      const response: FormErrorState<TSchema> = {
        status: 'validation-error',
        hasErrors: true,
        errors: formErrors,
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
        errors: [result.message],
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
        formErrors: [],
        values: {},
      }
    case 'success':
      return {
        fieldErrors: {},
        formErrors: [],
        values: {},
      }
    case 'validation-error':
      return {
        fieldErrors: state.fieldErrors,
        formErrors: state.errors,
        values: state.formDataObject,
      }
    case 'action-error':
      return {
        fieldErrors: {},
        formErrors: state.errors,
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
