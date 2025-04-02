// Define environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database
  CLIENT_PERMISSION: string
  ENCRYPT_KEY: string
}
