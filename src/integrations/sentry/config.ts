export type SentryRuntimeConfig = {
  dsn: string
  environment?: string
  release?: string
  tracesSampleRate: number
}

export type SentryClientConfig = SentryRuntimeConfig & {
  replaysSessionSampleRate: number
  replaysOnErrorSampleRate: number
}

export function parseSentrySampleRate(
  value: string | undefined,
  fallback: number,
) {
  if (value === undefined) {
    return fallback
  }

  const normalizedValue = value.trim()

  if (normalizedValue === '') {
    return fallback
  }

  const parsed = Number(normalizedValue)

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback
}

export function getClientSentryConfig(): SentryClientConfig | null {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const enabled =
    import.meta.env.MODE !== 'test' &&
    import.meta.env.VITE_SENTRY_ENABLED === 'true' &&
    Boolean(dsn)

  if (!enabled || !dsn) {
    return null
  }

  return {
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || undefined,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    tracesSampleRate: parseSentrySampleRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
    replaysSessionSampleRate: parseSentrySampleRate(
      import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0.1,
    ),
    replaysOnErrorSampleRate: parseSentrySampleRate(
      import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      1.0,
    ),
  }
}

export function getServerSentryConfig(
  env: NodeJS.ProcessEnv = process.env,
): SentryRuntimeConfig | null {
  const dsn = env.SENTRY_DSN ?? env.VITE_SENTRY_DSN
  const enabledValue = env.SENTRY_ENABLED ?? env.VITE_SENTRY_ENABLED
  const enabled =
    env.NODE_ENV !== 'test' && enabledValue === 'true' && Boolean(dsn)

  if (!enabled || !dsn) {
    return null
  }

  return {
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.VITE_SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE ?? env.VITE_SENTRY_RELEASE,
    tracesSampleRate: parseSentrySampleRate(
      env.SENTRY_TRACES_SAMPLE_RATE ?? env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
  }
}
