import { readFile } from 'node:fs/promises'
import { FIXTURE_MISS_LOG } from '@/integrations/provider-fixtures'

// a miss that no spec depended on (an intent preload, a tolerated fetch)
// fails the run here instead of rotting as server-log noise
export default async function failOnFixtureMisses() {
  let misses: string
  try {
    misses = await readFile(FIXTURE_MISS_LOG, 'utf8')
  } catch {
    return
  }
  const lines = [...new Set(misses.split('\n').filter(Boolean))]
  if (lines.length > 0) {
    throw new Error(
      `Provider fixture misses during the run - record them with pnpm test:e2e:record:\n${lines.join('\n')}`,
    )
  }
}
