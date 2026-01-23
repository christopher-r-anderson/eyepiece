import { createFileRoute, redirect } from '@tanstack/react-router'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { buildUrlSearchParamsMiddleware } from '@/server/lib/middleware'
import { confirmationSearchParamsSchema } from '@/features/auth/schemas'
import { urlToNextParam } from '@/features/auth/util'

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
        const supabase = createSupabaseServerClient()
        const { error } = await supabase.auth.verifyOtp({
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
            case 'email':
              // send them to where they started or home
              throw redirect({ to: next ?? '/', statusCode: SEE_OTHER })
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
