import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  FIXTURE_HIT_LOG,
  FIXTURE_MISS_LOG,
} from '@/integrations/provider-fixtures'

const FIXTURE_DIR = 'e2e/__provider-fixtures__'

async function readLogLines(path: string) {
  try {
    return [
      ...new Set((await readFile(path, 'utf8')).split('\n').filter(Boolean)),
    ]
  } catch {
    return []
  }
}

// a miss that no spec depended on (an intent preload, a tolerated fetch)
// fails the run here instead of rotting as server-log noise; so does a
// recording nothing read, which would otherwise accumulate just in case
export default async function failOnFixtureDrift() {
  const misses = await readLogLines(FIXTURE_MISS_LOG)
  if (misses.length > 0) {
    throw new Error(
      `Provider fixture misses during the run - record them with pnpm test:e2e:record:\n${misses.join('\n')}`,
    )
  }

  // a recording run reads nothing back, so only replay can judge unread
  if (process.env.PROVIDER_FIXTURE_MODE === 'record') return

  const hits = new Set(await readLogLines(FIXTURE_HIT_LOG))
  const recorded = (await readdir(FIXTURE_DIR))
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(FIXTURE_DIR, name))
  const unread = recorded.filter((path) => !hits.has(path))
  if (unread.length > 0) {
    throw new Error(
      `Provider fixtures nothing read during the run - delete them:\n${unread.join('\n')}`,
    )
  }
}
