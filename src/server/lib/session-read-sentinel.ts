import { AsyncLocalStorage } from 'node:async_hooks'

type SessionReadState = {
  reasons: Array<string>
}

const sessionReadStorage = new AsyncLocalStorage<SessionReadState>()

export function runWithSessionReadTracking<T>(fn: () => T): T {
  return sessionReadStorage.run({ reasons: [] }, fn)
}

// No-op outside a tracked scope. The Sentry request middleware relies on
// this: it reads auth claims for telemetry on every request *before* the
// tripwire middleware establishes the tracked scope, so its read never
// counts as a session read against the response cache policy.
export function markSessionRead(reason: string) {
  sessionReadStorage.getStore()?.reasons.push(reason)
}

export function getSessionReadReasons(): Array<string> {
  return sessionReadStorage.getStore()?.reasons ?? []
}

export function wasSessionRead() {
  return getSessionReadReasons().length > 0
}
