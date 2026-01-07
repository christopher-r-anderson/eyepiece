import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import netlify from '@netlify/vite-plugin-tanstack-start'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import { configDefaults } from 'vitest/config'

const config = defineConfig({
  plugins: [
    devtools(),
    netlify(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
    {
      ...optimizeLocales.vite({
        locales: ['en-US'],
      }),
      enforce: 'pre',
    },
  ],
  test: {
    exclude: [...configDefaults.exclude, '**/.pnpm-store/**'],
  },
})

export default config
