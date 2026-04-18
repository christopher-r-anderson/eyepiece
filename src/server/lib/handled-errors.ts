import type {
  ResultError,
  ResultErrorObservability,
  ResultErrorObservabilityContextValue,
} from '@/lib/result'
import {
  AppException,
  isAppException,
  isResultError,
  throwFromErrorResult,
} from '@/lib/result'

type ObservabilityAugment = {
  tags?: Record<string, string>
  context?: Record<string, ResultErrorObservabilityContextValue>
}

function mergeObservability(
  observability: ResultErrorObservability | undefined,
  augment: ObservabilityAugment,
): ResultErrorObservability | undefined {
  if (!observability && !augment.tags && !augment.context) {
    return observability
  }

  return {
    ...observability,
    tags: {
      ...observability?.tags,
      ...augment.tags,
    },
    context: {
      ...observability?.context,
      ...augment.context,
    },
  }
}

export function withHandledErrorContext<TErrorCode extends string | undefined>(
  error: ResultError<TErrorCode>,
  augment: ObservabilityAugment,
): ResultError<TErrorCode> {
  return {
    ...error,
    observability: mergeObservability(error.observability, augment),
  }
}

export function rethrowHandledErrorWithContext(
  error: unknown,
  augment: ObservabilityAugment,
): never {
  if (isAppException(error)) {
    throw new AppException(withHandledErrorContext(error.appError, augment))
  }

  if (isResultError(error)) {
    throwFromErrorResult(withHandledErrorContext(error, augment))
  }

  throw error
}
