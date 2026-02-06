import { useActionState } from 'react'
import { z } from 'zod'
import { createFormState } from './forms.types'
import type { Action, FormDataObject, FormState } from './forms.types'
import type { ZodError, ZodType } from 'zod'
import type { ErrorCode } from '@/lib/result'
import { resultIsError } from '@/lib/result'

export function useTypedActionState<
  TSchema extends ZodType,
  TResultData,
  TErrorCode extends ErrorCode = undefined,
>(
  schema: TSchema,
  action: Action<TSchema, TResultData, TErrorCode>,
  initialData?: FormDataObject,
) {
  const [typedFormAction, initialState] = createTypedAction(
    schema,
    action,
    initialData,
  )
  const [actionState, formAction, isPending] = useActionState(
    typedFormAction,
    initialState,
  )
  const state = isPending
    ? { ...actionState, status: 'processing' as const }
    : actionState

  return [state, formAction, isPending] as const
}

export function createTypedAction<
  TSchema extends ZodType,
  TResultData,
  TErrorCode extends ErrorCode = undefined,
>(
  schema: TSchema,
  action: Action<TSchema, TResultData, TErrorCode>,
  initialData?: FormDataObject,
) {
  const formAction = async function formAction(
    _previousState: FormState<TSchema>,
    formData: FormData,
  ): Promise<FormState<TSchema>> {
    const validation = schema.safeParse(Object.fromEntries(formData))
    if (!validation.success) {
      const { formError, fieldErrors } = extractZodErrors(validation.error)
      const response = createFormState.formError<TSchema>(
        dropBlobs(Object.fromEntries(formData.entries())),
        formError,
        fieldErrors,
      )
      return response
    }

    const result = await action(validation.data)
    if (resultIsError(result)) {
      return createFormState.actionError<TSchema>(
        dropBlobs(Object.fromEntries(formData.entries())),
        validation.data,
        result.error.message,
      )
    }

    return createFormState.success(
      dropBlobs(Object.fromEntries(formData.entries())),
    )
  }
  const initialState = createFormState.idle(initialData)
  return [formAction, initialState] as const
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
