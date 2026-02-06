import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import netlify from '@netlify/vite-plugin-tanstack-start'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import { configDefaults } from 'vitest/config'

const config = defineConfig(({ mode }) => ({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // to avoid `TypeError: Cannot read properties of null (reading 'useState')` during tests
    // see: https://github.com/TanStack/router/issues/6246
    !process.env.VITEST && tanstackStart(),
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
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.pnpm-store/**', '**/e2e/**'],
    env: loadEnv(mode, process.cwd(), ''),
    onConsoleLog(log) {
      if (log.includes('Multiple GoTrueClient instances detected')) return false
    },
  },
}))

export default config
