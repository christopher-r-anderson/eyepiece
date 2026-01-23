export type User = {
  id: string
  email?: string | null
  givenName?: string
  familyName?: string
}

export type AuthInteractionStrategy = 'modal' | 'page'

export type ResultError = {
  kind: 'error'
  message: string
}

export function Err(message: string): ResultError {
  return {
    kind: 'error',
    message,
  }
}

export type ResultSuccess<T> = {
  kind: 'success'
  data?: T
}

export function Ok<T>(data?: T): ResultSuccess<T> {
  return {
    kind: 'success',
    data,
  }
}

export type Result<T> = ResultError | ResultSuccess<T>

export function resultIsError<T>(result: Result<T>): result is ResultError {
  return result.kind === 'error'
}

export function resultIsSuccess<T>(
  result: Result<T>,
): result is ResultSuccess<T> {
  return result.kind === 'success'
}
