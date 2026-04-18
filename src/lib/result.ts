export type ErrorCode = string | undefined

export type ResultErrorFieldErrors = Record<string, string>

export type ResultErrorObservabilityKind = 'expected' | 'operational'

export type ResultErrorObservabilityLevel = 'info' | 'warning' | 'error'

export type ResultErrorObservabilityContextValue =
  | string
  | number
  | boolean
  | null

export type ResultErrorObservability = {
  kind?: ResultErrorObservabilityKind
  level?: ResultErrorObservabilityLevel
  report?: boolean
  tags?: Record<string, string>
  context?: Record<string, ResultErrorObservabilityContextValue>
}

type ResultErrorCodeField<TErrorCode extends ErrorCode> = [
  Exclude<TErrorCode, undefined>,
] extends [never]
  ? { code?: undefined }
  : undefined extends TErrorCode
    ? { code?: Exclude<TErrorCode, undefined> }
    : { code: TErrorCode }

export type ResultError<TErrorCode extends ErrorCode = undefined> =
  ResultErrorCodeField<TErrorCode> & {
    message: string
    fieldErrors?: ResultErrorFieldErrors
    // this prevents `Result`s being used across server functions due to not being serializable, currently throwing, revisit if needed
    cause?: unknown
    observability?: ResultErrorObservability
  }

export type ErrorResult<TErrorCode extends ErrorCode = undefined> = {
  kind: 'error'
  data?: never
  error: ResultError<TErrorCode>
}

export function Err<TErrorCode extends ErrorCode = undefined>(
  error: ResultError<TErrorCode>,
): ErrorResult<TErrorCode> {
  return {
    kind: 'error',
    error,
  }
}

export type SuccessResult<TData> = {
  kind: 'success'
  data: TData
  error?: never
}

export function Ok<TData>(data: TData): SuccessResult<TData> {
  return {
    kind: 'success',
    data,
  }
}

export type Result<TData, TErrorCode extends ErrorCode = undefined> =
  | ErrorResult<TErrorCode>
  | SuccessResult<TData>

export function resultIsError<TData, TErrorCode extends ErrorCode = undefined>(
  result: Result<TData, TErrorCode>,
): result is ErrorResult<TErrorCode> {
  return result.kind === 'error'
}

export function resultIsSuccess<
  TData,
  TErrorCode extends ErrorCode = undefined,
>(result: Result<TData, TErrorCode>): result is SuccessResult<TData> {
  return result.kind === 'success'
}

export class AppException<
  TErrorCode extends ErrorCode = undefined,
> extends Error {
  readonly appError: ResultError<TErrorCode>

  constructor(appError: ResultError<TErrorCode>) {
    super(appError.message, { cause: appError.cause })
    this.name = 'AppException'
    this.appError = appError
  }
}

export function isAppException(
  error: unknown,
): error is AppException<string | undefined> {
  return error instanceof AppException
}

export function isResultError(
  error: unknown,
): error is ResultError<string | undefined> {
  if (!error || typeof error !== 'object' || error instanceof Error) {
    return false
  }

  return 'message' in error && typeof error.message === 'string'
}

export function getEmbeddedResultError(
  error: unknown,
): ResultError<string | undefined> | undefined {
  if (!error || typeof error !== 'object' || !('appError' in error)) {
    return undefined
  }

  const appError = error.appError

  return isResultError(appError) ? appError : undefined
}

export function errorFromUnknown(
  error: unknown,
  fallbackMessage: string = 'An unknown error occurred',
): ResultError<string | undefined> {
  if (isAppException(error)) {
    return error.appError
  }

  if (isResultError(error)) {
    return error
  }

  const embeddedResultError = getEmbeddedResultError(error)

  if (embeddedResultError) {
    return embeddedResultError
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      cause: error,
    }
  }

  return {
    message: fallbackMessage,
    cause: error,
  }
}

export function throwFromErrorResult<TErrorCode extends ErrorCode = undefined>(
  error: ResultError<TErrorCode>,
): never {
  throw new AppException(error)
}

export function unwrapOrThrow<TData, TErrorCode extends ErrorCode = undefined>(
  result: Result<TData, TErrorCode>,
): TData {
  if (resultIsSuccess(result)) return result.data
  throwFromErrorResult(result.error)
}
