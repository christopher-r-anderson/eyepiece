import { useActionState } from 'react'
import { z } from 'zod'
import { createFormState } from './forms.types'
import type {
  Action,
  ClientActionResultError,
  ErrorMessages,
  FormDataObject,
  FormSchema,
  FormState,
} from './forms.types'
import type { ZodError } from 'zod'
import type {
  ErrorCode,
  ResultError,
  ResultErrorFieldErrors,
} from '@/lib/result'
import { resultIsError } from '@/lib/result'

export function useTypedActionState<
  TSchema extends FormSchema,
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
  TSchema extends FormSchema,
  TResultData,
  TErrorCode extends ErrorCode = undefined,
>(
  schema: TSchema,
  action: Action<TSchema, TResultData, TErrorCode>,
  initialData?: FormDataObject,
) {
  const formAction = async function formAction(
    _previousState: FormState<TSchema, TErrorCode>,
    formData: FormData,
  ): Promise<FormState<TSchema, TErrorCode>> {
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
      return createFormState.actionError<TSchema, TErrorCode>(
        dropBlobs(Object.fromEntries(formData.entries())),
        validation.data,
        toClientActionResultError(schema, result.error),
      )
    }

    return createFormState.success(
      dropBlobs(Object.fromEntries(formData.entries())),
    )
  }
  const initialState = createFormState.idle(initialData)
  return [formAction, initialState] as const
}

function toClientActionResultError<
  TSchema extends FormSchema,
  TErrorCode extends ErrorCode = undefined,
>(
  schema: TSchema,
  error: ResultError<TErrorCode>,
): ClientActionResultError<TSchema, TErrorCode> {
  return {
    message: error.message,
    code: getResultErrorCode(error),
    fieldErrors: filterFieldErrorsForSchema(schema, error.fieldErrors),
  }
}

function getResultErrorCode<TErrorCode extends ErrorCode = undefined>(
  error: ResultError<TErrorCode>,
): TErrorCode {
  return ('code' in error ? error.code : undefined) as TErrorCode
}

function filterFieldErrorsForSchema<TSchema extends FormSchema>(
  schema: TSchema,
  fieldErrors?: ResultErrorFieldErrors,
): ErrorMessages<TSchema> | undefined {
  if (!fieldErrors) {
    return undefined
  }

  const schemaFieldNames = getSchemaFieldNames(schema)
  const filteredFieldErrors = Object.fromEntries(
    Object.entries(fieldErrors).filter(([key]) => schemaFieldNames.has(key)),
  )

  return Object.keys(filteredFieldErrors).length > 0
    ? (filteredFieldErrors as ErrorMessages<TSchema>)
    : undefined
}

function getSchemaFieldNames(schema: FormSchema): ReadonlySet<string> {
  return new Set(Object.keys(schema.shape))
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
