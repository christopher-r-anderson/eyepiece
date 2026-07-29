import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { makeProfilesCommands } from './profiles.commands'
import { redirectSearchParamsSchema } from '@/lib/route.schema'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { profileSchema } from '@/domain/profile/profile.schema'
import { resultIsError } from '@/lib/result'

// Native (no-JS) fallback for the profile forms; hydrated submits intercept
// and run the client command instead. Must always end in a redirect.

const nextSchema = redirectSearchParamsSchema.shape.next

const upsertProfileFormSchema = profileSchema.extend({
  // which page posted: settings returns with a status, complete-profile
  // moves on to its destination
  context: z.enum(['settings', 'complete']),
  next: nextSchema,
})

function withParams(href: string, params: Record<string, string | undefined>) {
  const url = new URL(href, 'http://relative.local')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    }
  }
  return `${url.pathname}${url.search}${url.hash}`
}

export const upsertProfileFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const raw = formData instanceof FormData ? Object.fromEntries(formData) : {}
    const backHref =
      raw.context === 'complete' ? '/complete-profile' : '/settings/profile'
    const parsed = upsertProfileFormSchema.safeParse(raw)
    if (!parsed.success) {
      // 303 turns the form POST into a GET at the target; 307 would re-POST
      throw redirect({
        href: withParams(backHref, {
          formError: 'Please check the form and try again.',
          next: nextSchema.parse(
            typeof raw.next === 'string' ? raw.next : undefined,
          ),
        }),
        statusCode: 303,
      })
    }
    const { context, next, ...profile } = parsed.data
    const result = await makeProfilesCommands(
      createUserSupabaseServerClient(),
    ).upsertProfile(profile)
    if (resultIsError(result)) {
      throw redirect({
        href: withParams(backHref, {
          formError: result.error.message,
          next,
        }),
        statusCode: 303,
      })
    }
    if (context === 'complete') {
      throw redirect({ href: next ?? '/', statusCode: 303 })
    }
    throw redirect({
      href: withParams(backHref, { status: 'updated' }),
      statusCode: 303,
    })
  })
