import { createFileRoute, redirect } from '@tanstack/react-router'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { confirmationSearchParamsSchema } from '@/features/auth/schemas'
import { urlToNextParam } from '@/lib/util'
import { makeUpsertProfile } from '@/features/profiles/profile-service'
import { resultIsSuccess } from '@/lib/result'

const SEE_OTHER = 303

export const Route = createFileRoute('/(auth)/auth/confirm')({
  server: {
    middleware: [
      buildUrlSearchParamsMiddleware(confirmationSearchParamsSchema),
    ],
    handlers: {
      async GET({ context: { searchParams } }) {
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
          throw redirect({
            to: '/auth/confirm-error',
            search: { err: error.code, type, next },
            statusCode: SEE_OTHER,
          })
        } else {
          switch (type) {
            // register flow
            case 'email': {
              // create profile
              // should have a user here, but it isn't guaranteed
              if (!data.user) {
                throw redirect({
                  to: '/login',
                  search: { next: next ?? '/' },
                  statusCode: SEE_OTHER,
                })
              }
              const user = data.user
              if (user.user_metadata.display_name) {
                const result = await makeUpsertProfile(supabase)({
                  id: user.id,
                  displayName: user.user_metadata.display_name,
                })
                if (resultIsSuccess(result)) {
                  throw redirect({ to: next ?? '/', statusCode: SEE_OTHER })
                }
              }
              throw redirect({
                to: '/complete-profile',
                search: { next },
                statusCode: SEE_OTHER,
              })
              // send them to where they started or home
            }
            // forgot password flow
            case 'recovery':
              // pass along next to send them where they started or to home after they update their password
              throw redirect({
                to: '/auth/update-password',
                search: { next: next ?? '/' },
                statusCode: SEE_OTHER,
              })
          }
        }
      },
    },
  },
})
