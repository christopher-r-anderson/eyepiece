import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  FIXTURE_HIT_LOG,
  FIXTURE_MISS_LOG,
} from '@/integrations/provider-fixtures'

const FIXTURE_DIR = 'e2e/__provider-fixtures__'

// recordings a stubbed spec reads only when the browser lets a fetch past
// page.route: measured on firefox (4 of 6 runs, never on chromium or
// webkit) for the year-edit specs in search.spec. Deleting one would turn
// that escape into a miss, so it stays until #305 removes the stub
const READ_ONLY_ON_ESCAPE = new Set([
  join(
    FIXTURE_DIR,
    'images-api-nasa-gov-search-page-1-page-size-24-q-moon-year-end-2001-year-start-1.c491f6df1d.json',
  ),
])

async function readLogLines(path: string) {
  try {
    return [
      ...new Set((await readFile(path, 'utf8')).split('\n').filter(Boolean)),
    ]
  } catch {
    return []
  }
}

// a miss that no spec depended on (a tolerated fetch)
// fails the run here instead of rotting as server-log noise; so does a
// recording nothing read (full runs only), which would otherwise
// accumulate just in case
export default async function failOnFixtureDrift() {
  const misses = await readLogLines(FIXTURE_MISS_LOG)
  if (misses.length > 0) {
    throw new Error(
      `Provider fixture misses during the run - record them with pnpm test:e2e:record:\n${misses.join('\n')}`,
    )
  }

  // only a full replay run can judge unread: a focused run leaves the other
  // specs' recordings unread, and a recording run reads nothing back
  if (process.env.PROVIDER_FIXTURE_AUDIT !== '1') return
  if (process.env.PROVIDER_FIXTURE_MODE === 'record') return

  const hits = new Set(await readLogLines(FIXTURE_HIT_LOG))
  const recorded = (await readdir(FIXTURE_DIR))
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(FIXTURE_DIR, name))
  const unread = recorded.filter(
    (path) => !hits.has(path) && !READ_ONLY_ON_ESCAPE.has(path),
  )
  if (unread.length > 0) {
    throw new Error(
      `Provider fixtures nothing read during the run - delete them:\n${unread.join('\n')}`,
    )
  }
}
