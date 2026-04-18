import type { ProviderId } from '@/domain/provider/provider.schema'
import type { ResultErrorObservabilityContextValue } from '@/lib/result'

type ProviderClientErrorOptions = {
  providerId: ProviderId
  operation: string
  message: string
  status?: number
  kind?: 'not_found'
  url: string
  cause?: unknown
  context?: Record<string, ResultErrorObservabilityContextValue>
}

export class ProviderClientError extends Error {
  readonly providerId: ProviderId
  readonly operation: string
  readonly status: number | undefined
  readonly kind: 'not_found' | undefined
  readonly url: string
  readonly context:
    | Record<string, ResultErrorObservabilityContextValue>
    | undefined

  constructor(options: ProviderClientErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    )
    this.name = 'ProviderClientError'
    this.providerId = options.providerId
    this.operation = options.operation
    this.status = options.status
    this.kind = options.kind
    this.url = options.url
    this.context = options.context
  }
}

export function isProviderClientError(
  error: unknown,
): error is ProviderClientError {
  return error instanceof ProviderClientError
}
