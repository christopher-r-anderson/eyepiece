export const DEV_OBSERVABILITY_SERVER_ERROR_MESSAGE =
  'Dev observability: server route failure'

export const DEV_OBSERVABILITY_VALIDATION_ERROR_BODY = {
  error: {
    code: 'INVALID_INPUT',
    message: 'Dev observability validation error',
  },
} as const

export function throwDevObservabilityServerError(): never {
  throw new Error(DEV_OBSERVABILITY_SERVER_ERROR_MESSAGE)
}

export function createDevObservabilityValidationResponse() {
  return new Response(JSON.stringify(DEV_OBSERVABILITY_VALIDATION_ERROR_BODY), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
