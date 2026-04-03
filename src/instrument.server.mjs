import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: 'https://d4f083538dc4d5cc4210ab9a2cb2c295@o4511140875206656.ingest.us.sentry.io/4511140878155776',
  tracesSampleRate: 0.1,
})
