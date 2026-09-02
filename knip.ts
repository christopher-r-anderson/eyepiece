import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['netlify/edge-functions/**/*.ts!'],
  // not auto-enabled without a direct postcss dependency; vite loads the config
  postcss: true,
  ignore: ['src/integrations/supabase/database.types.ts'],
  ignoreDependencies: [
    '@pandacss/mcp',
    // resolved by panda via the presets string
    '@pandacss/preset-base',
    // the panda plugin assumes a direct install; vite bundles its own
    'postcss',
  ],
  ignoreBinaries: ['act'],
}

export default config
