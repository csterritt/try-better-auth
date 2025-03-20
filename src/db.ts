import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export type DrizzleD1Database = ReturnType<typeof initializeDatabase>

// Initialize the database with Drizzle
export function initializeDatabase(d1: D1Database) {
  return drizzle(d1, { schema })
}
