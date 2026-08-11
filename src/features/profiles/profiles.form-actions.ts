import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { makeProfilesCommands } from './profiles.commands'
import { INVALID_INPUT_CODE } from '@/lib/form-errors'
import { nextSchema } from '@/lib/route.schema'
import { redirectWithParams } from '@/lib/form-action-redirect'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { profileSchema } from '@/domain/profile/profile.schema'
import { resultIsError } from '@/lib/result'

// Native (no-JS) fallback for the profile forms; hydrated submits intercept
// and run the client command instead. Must always end in a redirect.

const upsertProfileFormSchema = profileSchema.extend({
  // which page posted: settings returns with a status, complete-profile
  // moves on to its destination
  context: z.enum(['settings', 'complete']),
  next: nextSchema,
})

export const upsertProfileFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const raw = formData instanceof FormData ? Object.fromEntries(formData) : {}
    const backHref =
      raw.context === 'complete' ? '/complete-profile' : '/settings/profile'
    const parsed = upsertProfileFormSchema.safeParse(raw)
    if (!parsed.success) {
      redirectWithParams(backHref, {
        formError: INVALID_INPUT_CODE,
        next: nextSchema.parse(
          typeof raw.next === 'string' ? raw.next : undefined,
        ),
      })
    }
    const { context, next, ...profile } = parsed.data
    const result = await makeProfilesCommands(
      createUserSupabaseServerClient(),
    ).upsertProfile(profile)
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code,
        next,
      })
    }
    if (context === 'complete') {
      redirectWithParams(next ?? '/')
    }
    redirectWithParams(backHref, { status: 'updated' })
  })
