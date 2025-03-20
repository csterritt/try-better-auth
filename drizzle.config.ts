import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: import.meta.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: import.meta.env.CLOUDFLARE_DATABASE_ID || process.env.CLOUDFLARE_DATABASE_ID || '',
    token: import.meta.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_D1_TOKEN || '',
  },
} satisfies Config
