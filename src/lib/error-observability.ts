import { isNotFound, isRedirect } from '@tanstack/react-router'
import { getEmbeddedResultError, isAppException, isResultError } from './result'
import type {
  ResultError,
  ResultErrorObservability,
  ResultErrorObservabilityKind,
  ResultErrorObservabilityLevel,
} from './result'

export type ErrorObservability = {
  kind: ResultErrorObservabilityKind
  level: ResultErrorObservabilityLevel
  shouldReport: boolean
}

const EXPECTED_ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'FORBIDDEN',
  'INVALID_INPUT',
  'INVALID_QUERY_PARAMS',
  'NOT_FOUND',
  'UNSUPPORTED_PROVIDER_OPERATION',
  'VALIDATE_SEARCH',
])

const EXPECTED_ERROR_CODE_PATTERNS = [
  /auth_required/i,
  /forbidden/i,
  /invalid/i,
  /not[_-]?found/i,
  /unsupported/i,
  /validation/i,
]

function toObservability(
  options: Pick<ErrorObservability, 'kind'> &
    Partial<Omit<ErrorObservability, 'kind'>>,
): ErrorObservability {
  const shouldReport = options.shouldReport ?? options.kind === 'operational'

  return {
    kind: options.kind,
    level:
      options.level ?? (options.kind === 'operational' ? 'error' : 'warning'),
    shouldReport,
  }
}

export function expectedErrorObservability(
  options: Omit<ResultErrorObservability, 'kind' | 'report'> = {},
): ResultErrorObservability {
  return {
    ...options,
    kind: 'expected',
    level: options.level ?? 'warning',
    report: false,
  }
}

export function operationalErrorObservability(
  options: Omit<ResultErrorObservability, 'kind' | 'report'> = {},
): ResultErrorObservability {
  return {
    ...options,
    kind: 'operational',
    level: options.level ?? 'error',
    report: true,
  }
}

function codeLooksExpected(code: string | undefined) {
  if (!code) {
    return false
  }

  if (EXPECTED_ERROR_CODES.has(code)) {
    return true
  }

  return EXPECTED_ERROR_CODE_PATTERNS.some((pattern) => pattern.test(code))
}

function getResponseObservability(status: number): ErrorObservability {
  if (status >= 400 && status < 500) {
    return toObservability({ kind: 'expected', level: 'warning' })
  }

  return toObservability({
    kind: 'operational',
    level: status >= 500 ? 'error' : 'warning',
  })
}

function getExplicitObservability(
  observability: ResultErrorObservability,
): ErrorObservability {
  return toObservability({
    kind: observability.kind ?? 'operational',
    level: observability.level,
    shouldReport: observability.report,
  })
}

export function getResultErrorObservability<
  TErrorCode extends string | undefined,
>(error: ResultError<TErrorCode>): ErrorObservability {
  if (error.observability) {
    return getExplicitObservability(error.observability)
  }

  if (
    codeLooksExpected(error.code) ||
    (error.fieldErrors && Object.keys(error.fieldErrors).length > 0)
  ) {
    return toObservability({ kind: 'expected', level: 'warning' })
  }

  return toObservability({ kind: 'operational', level: 'error' })
}

export function getErrorObservability(error: unknown): ErrorObservability {
  if (isRedirect(error) || isNotFound(error)) {
    return toObservability({ kind: 'expected', level: 'info' })
  }

  if (error instanceof Response) {
    return getResponseObservability(error.status)
  }

  if (error && typeof error === 'object') {
    const status =
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined
    const statusCode =
      'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined
    const routerCode =
      'routerCode' in error && typeof error.routerCode === 'string'
        ? error.routerCode
        : undefined

    if (routerCode === 'VALIDATE_SEARCH') {
      return toObservability({ kind: 'expected', level: 'info' })
    }

    if (status !== undefined) {
      return getResponseObservability(status)
    }

    if (statusCode !== undefined) {
      return getResponseObservability(statusCode)
    }
  }

  if (isAppException(error)) {
    return getResultErrorObservability(error.appError)
  }

  if (isResultError(error)) {
    return getResultErrorObservability(error)
  }

  const embeddedResultError = getEmbeddedResultError(error)

  if (embeddedResultError) {
    return getResultErrorObservability(embeddedResultError)
  }

  return toObservability({ kind: 'operational', level: 'error' })
}

export function shouldReportError(error: unknown) {
  return getErrorObservability(error).shouldReport
}
