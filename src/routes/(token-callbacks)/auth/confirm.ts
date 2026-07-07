import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { confirmationSearchParamsSchema } from '@/features/auth/auth.schema'
import { urlToNextParam } from '@/lib/utils'
import { makeProfilesCommands } from '@/features/profiles/profiles.commands'
import { logErrorWithObservability } from '@/lib/error-logging'
import { resultIsSuccess } from '@/lib/result'
import {
  createApiErrorResponse,
  formatValidationIssues,
} from '@/server/lib/api-errors'
import {
  createPrivateNoStoreHeaders,
  withPrivateNoStoreCacheControl,
} from '@/server/lib/utils'

const SEE_OTHER = 303
const UNEXPECTED_SERVER_ERROR_MESSAGE = 'Unexpected server error.'

function buildRedirectHref(
  pathname: string,
  search?: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(search ?? {})) {
    if (value !== undefined) {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

function createPrivateNoStoreApiErrorResponse(
  error: Parameters<typeof createApiErrorResponse>[0],
  status: number,
) {
  return withPrivateNoStoreCacheControl(createApiErrorResponse(error, status))
}

function throwPrivateNoStoreRedirect(href: string): never {
  throw redirect({
    headers: createPrivateNoStoreHeaders(),
    href,
    statusCode: SEE_OTHER,
  })
}

export const Route = createFileRoute('/(token-callbacks)/auth/confirm')({
  server: {
    handlers: {
      async GET({ request }) {
        try {
          const url = new URL(request.url)
          const parsedSearchParams = confirmationSearchParamsSchema.safeParse(
            Object.fromEntries(url.searchParams.entries()),
          )

          if (!parsedSearchParams.success) {
            return createPrivateNoStoreApiErrorResponse(
              {
                code: 'INVALID_QUERY_PARAMS',
                message: 'One or more query parameters are invalid.',
                issues: formatValidationIssues(parsedSearchParams.error),
              },
              400,
            )
          }

          const searchParams = parsedSearchParams.data
          const { token_hash, type, next: nextUrl } = searchParams
          const next =
            typeof nextUrl === 'string' ? urlToNextParam(nextUrl) : undefined
          const supabase = createUserSupabaseServerClient()
          const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
          })
          if (error) {
            // pass along next for the email if they request a resend on the error page
            return throwPrivateNoStoreRedirect(
              buildRedirectHref('/auth/confirm-error', {
                err: error.code,
                next,
                type,
              }),
            )
          } else {
            switch (type) {
              // register flow
              case 'email': {
                // create profile
                // should have a user here, but it isn't guaranteed
                if (!data.user) {
                  return throwPrivateNoStoreRedirect(
                    buildRedirectHref('/login', { next: next ?? '/' }),
                  )
                }
                const user = data.user
                if (user.user_metadata.display_name) {
                  const commands = makeProfilesCommands(supabase)
                  const profileResult = await commands.upsertProfile({
                    id: user.id,
                    displayName: user.user_metadata.display_name,
                  })
                  if (resultIsSuccess(profileResult)) {
                    return throwPrivateNoStoreRedirect(next ?? '/')
                  }
                }
                return throwPrivateNoStoreRedirect(
                  buildRedirectHref('/complete-profile', { next }),
                )
                // send them to where they started or home
              }
              // forgot password flow
              case 'recovery':
                // pass along next to send them where they started or to home after they update their password
                return throwPrivateNoStoreRedirect(
                  buildRedirectHref('/auth/update-password', {
                    next: next ?? '/',
                  }),
                )
            }
          }
        } catch (error) {
          // Redirects are Response instances in the current router, so the
          // second branch covers them today; check isRedirect explicitly so a
          // future router change cannot swallow successful confirmations into
          // the 500 fallback below.
          if (isRedirect(error) && !(error instanceof Response)) {
            throw error
          }
          if (error instanceof Response) {
            throw withPrivateNoStoreCacheControl(error)
          }

          logErrorWithObservability(
            'Token callback handler failed unexpectedly',
            error,
            { request: request.url },
          )

          return createPrivateNoStoreApiErrorResponse(
            {
              code: 'INTERNAL_SERVER_ERROR',
              message: UNEXPECTED_SERVER_ERROR_MESSAGE,
            },
            500,
          )
        }
      },
    },
  },
})
