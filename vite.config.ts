import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import netlify from '@netlify/vite-plugin-tanstack-start'
import optimizeLocales from '@react-aria/optimize-locales-plugin'

const config = defineConfig(({ mode }) => ({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // to avoid `TypeError: Cannot read properties of null (reading 'useState')` during tests
    // see: https://github.com/TanStack/router/issues/6246
    !process.env.VITEST &&
      tanstackStart({
        importProtection: {
          client: {
            files: ['**/server/**'],
          },
        },
      }),
    viteReact(),
    netlify(),
    {
      ...optimizeLocales.vite({
        locales: ['en-US'],
      }),
      enforce: 'pre',
    },
  ],
  test: {
    // tried moving this to just in the unit test settings but it did not filter them.
    onConsoleLog(log: string) {
      if (log.includes('Multiple GoTrueClient instances detected')) return false
    },
    env: loadEnv(mode, process.cwd(), ''),
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['**/*unit.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: '**/*.integration.test.ts',
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
  },
}))

export default config
