import * as Sentry from '@sentry/tanstackstart-react'

function parseSampleRate(value, fallback) {
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

const sentryDsn = process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN
const sentryEnabledValue =
  process.env.SENTRY_ENABLED ?? process.env.VITE_SENTRY_ENABLED
const sentryEnabled =
  process.env.NODE_ENV !== 'test' &&
  sentryEnabledValue === 'true' &&
  Boolean(sentryDsn)

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.VITE_SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE ?? process.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(
      process.env.SENTRY_TRACES_SAMPLE_RATE ??
        process.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
  })
}
