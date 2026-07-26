import { tanstackConfig } from '@tanstack/eslint-config'
import queryPlugin from '@tanstack/eslint-plugin-query'

// flat-config rule values are replaced per matching file, never merged:
// every no-restricted-imports block below states its complete value,
// composed from the pieces here
const reactUseIdPath = {
  name: 'react',
  importNames: ['useId'],
  message: 'Import useId from "react-aria" instead of "react".',
}

const reactAriaComponentsPath = {
  name: 'react-aria-components',
  message:
    'Import from our UI layer (e.g. "@/components/ui/forms") instead of directly from react-aria-components.',
}

const routeApiPath = {
  name: '@tanstack/react-router',
  importNames: ['getRouteApi'],
  message:
    'Route-specific APIs stay in route files and their -components/. Pass data down as props.',
}

const basePaths = [reactUseIdPath, reactAriaComponentsPath]
const nonRoutePaths = [...basePaths, routeApiPath]

const basePatterns = [
  {
    group: ['react-aria-components/*'],
    message:
      'Import from our UI layer (e.g. "@/components/ui/forms") instead of directly from react-aria-components.',
  },
  {
    group: [
      '../**/components/ui',
      '../**/components/ui/*',
      './**/components/ui',
      './**/components/ui/*',
    ],
    message: 'Import UI via "@/components/ui/…" instead of relative paths.',
  },
]

// relative spellings cover the layer depths that exist today; a boundary
// crossed relatively from deeper nesting is invisible to these
// specifier-matching rules (see STYLEGUIDE Import Layering)
const relativeDepths = ['../', '../../', '../../../', '../../../../']

function layerGroup(layer: string) {
  return [
    `@/${layer}/**`,
    ...relativeDepths.map((depth) => `${depth}${layer}/**`),
  ]
}

const featuresGroup = layerGroup('features')
const componentsGroup = layerGroup('components')
const appGroup = layerGroup('app')
const domainGroup = layerGroup('domain')

// non-UI primitives features may share until they graduate to a shared home
const crossFeatureAllowlist = [
  '!@/features/auth/get-user',
  '!@/features/auth/auth.queries',
  '!@/features/auth/auth.utils',
  '!@/features/assets/asset-preview-snapshots.repo',
  '!@/features/assets/asset-preview-snapshots.server',
  '!@/features/assets/asset-preview-snapshots.const',
]

export default [
  {
    ignores: [
      '.netlify/**',
      './src/integrations/supabase/database.types.ts',
      'playwright-report/**',
      'styled-system/**',
    ],
  },
  ...tanstackConfig,
  ...queryPlugin.configs['flat/recommended'],
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: basePaths,
          patterns: basePatterns,
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/routes/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nonRoutePaths,
          patterns: basePatterns,
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nonRoutePaths,
          patterns: [
            ...basePatterns,
            {
              // contents-only glob: excluding the feature directory itself
              // would make the file-level negations unmatchable (gitignore
              // rule: no re-including under an excluded parent). Same-feature
              // imports are spelled relative, so no self-exception is needed.
              group: ['@/features/*/**', ...crossFeatureAllowlist],
              message:
                'Features must not import other features. Same-feature imports are relative.',
            },
            {
              group: appGroup,
              message: 'Features must not import the app shell.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nonRoutePaths,
          patterns: [
            ...basePatterns,
            {
              group: featuresGroup,
              message: 'Shared components must not import features.',
            },
            {
              group: appGroup,
              message: 'Shared components must not import the app shell.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [reactUseIdPath, routeApiPath],
          patterns: [
            {
              group: featuresGroup,
              message: 'The UI kit must not import features.',
            },
            {
              group: appGroup,
              message: 'The UI kit must not import the app shell.',
            },
            {
              group: domainGroup,
              message: 'The UI kit is domain-agnostic.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/domain/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      'src/integrations/**/*.{ts,tsx}',
      'src/server/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nonRoutePaths,
          patterns: [
            ...basePatterns,
            {
              group: featuresGroup,
              message: 'Base layers must not import features.',
            },
            {
              group: componentsGroup,
              message: 'Base layers must not import components.',
            },
            {
              group: appGroup,
              message: 'Base layers must not import the app shell.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/integrations/react-aria-components/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/routes/(public)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...basePaths,
            {
              name: '@/integrations/supabase/user',
              message:
                'Do not use the user Supabase client in public page routes. Use public APIs/client instead.',
            },
            {
              name: '@/integrations/supabase/user.hooks',
              message:
                'Do not use the user Supabase client in public page routes. Use public APIs/client instead.',
            },
            {
              name: '@/app/guards',
              importNames: ['requireAuthenticated'],
              message: 'Public routes must not import authenticated guards.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'PRIVATE_DOCUMENT_CACHE_CONTROL',
                'getPrivateDocumentCacheControlHeader',
              ],
              message:
                'Public routes must not use private/authenticated policy helpers.',
            },
          ],
          patterns: basePatterns,
        },
      ],
    },
  },
  {
    files: ['src/routes/(private)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...basePaths,
            {
              name: '@/lib/route-policy',
              importNames: [
                'PUBLIC_DOCUMENT_CACHE_CONTROL',
                'getPublicDocumentCacheControlHeader',
              ],
              message:
                'Private routes must not use public cache/policy helpers.',
            },
          ],
          patterns: basePatterns,
        },
      ],
    },
  },
  {
    files: ['src/routes/(token-callbacks)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...basePaths,
            {
              name: '@/components/ui/forms',
              message:
                'Token-callback routes should be server handlers and must not depend on UI components.',
            },
            {
              name: '@/components/ui/link',
              message:
                'Token-callback routes should be server handlers and must not depend on UI components.',
            },
            {
              name: '@/features/auth/hooks/use-auth-commands',
              message:
                'Token-callback routes must not use client auth commands.',
            },
            {
              name: '@/integrations/supabase/user.hooks',
              message:
                'Token-callback routes must not depend on user-supabase client hooks.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'PUBLIC_DOCUMENT_CACHE_CONTROL',
                'PRIVATE_DOCUMENT_CACHE_CONTROL',
                'getPublicDocumentCacheControlHeader',
                'getPrivateDocumentCacheControlHeader',
              ],
              message:
                'Token-callback route policy is inherited from /(token-callbacks)/route.tsx; do not override in descendants.',
            },
          ],
          patterns: basePatterns,
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.value='Cache-Control'][value.type='Literal']",
          message:
            'Do not use Cache-Control string literals in route files. Use route-policy helper functions instead.',
        },
        {
          selector: "Property[key.value='cache-control'][value.type='Literal']",
          message:
            'Do not use cache-control string literals in route files. Use route-policy helper functions instead.',
        },
        {
          selector: 'Property[key.value=/^(?:netlify-)?cdn-cache-control$/i]',
          message:
            'Do not set CDN cache-control headers directly in route files. Use route-policy helper functions instead.',
        },
      ],
    },
  },
]
