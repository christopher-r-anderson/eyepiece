export type ErrorCode = string | undefined

export type ResultError<TErrorCode extends ErrorCode = undefined> = {
  message: string
  code?: TErrorCode
  fieldErrors?: Record<string, string>
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
