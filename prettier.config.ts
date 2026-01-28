import type { Config } from 'prettier'

const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-sql-cst'],
  overrides: [
    {
      files: '*.sql',
      options: {
        parser: 'postgresql',
      },
    },
  ],
}

export default config
