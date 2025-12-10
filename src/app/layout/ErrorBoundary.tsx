import type { ErrorComponentProps } from '@tanstack/react-router'

export function ErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <div>
      <h1>Something went wrong</h1>

      <p>
        {error instanceof Error
          ? error.message
          : 'An unexpected error occurred.'}
      </p>

      <button onClick={reset}>Try again</button>
    </div>
  )
}
