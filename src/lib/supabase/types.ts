import type { SupabaseClient as UntypedClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type SupabaseClient = UntypedClient<Database>
