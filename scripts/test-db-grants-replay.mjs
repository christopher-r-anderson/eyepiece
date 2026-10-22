import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Deliberately opt-in: this destroys local data, including auth users.
if (process.argv[2] !== '--reset-local') {
  throw new Error('This resets local Supabase. Pass --reset-local to proceed.')
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) throw result.error
  // Do not include command arguments: a local DB URL contains credentials.
  if (result.status !== 0) throw new Error(`${command} failed`)
  return result.stdout
}

const status = JSON.parse(
  run('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
  }),
)
for (const key of ['DB_URL', 'API_URL']) {
  const url = new URL(status[key])
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error(`Refusing non-local ${key}`)
  }
}
console.log(
  'Verified loopback Supabase database and API; resetting local data.',
)

const supabase = (...args) => run('pnpm', ['exec', 'supabase', ...args])
const sql = (input) =>
  run('psql', [status.DB_URL, '-X', '-v', 'ON_ERROR_STOP=1'], {
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
  })

// First cover the real historical replay, including legacy broad defaults.
supabase('db', 'reset', '--local')
supabase('test', 'db')

// Then stop before any application table exists. Remove the baseline's
// automatic grants so successful tests must depend on explicit migration SQL.
supabase('db', 'reset', '--local', '--version', '20260126221717', '--no-seed')
sql(`
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
`)
supabase('migration', 'up', '--local')
sql(readFileSync('supabase/seeds/users.sql', 'utf8'))
supabase('test', 'db')
