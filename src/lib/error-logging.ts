import { getErrorObservability } from './error-observability'

type ErrorLogDetails = Record<string, unknown>

type LogMethod = 'error' | 'warn' | 'info'

function getLogMethod(level: 'info' | 'warning' | 'error'): LogMethod {
  switch (level) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warn'
    case 'info':
      return 'info'
  }
}

export function logErrorWithObservability(
  message: string,
  error: unknown,
  details: ErrorLogDetails = {},
) {
  const observability = getErrorObservability(error)
  const logMethod = getLogMethod(observability.level)

  console[logMethod](message, {
    ...details,
    error,
    observability,
  })
}
