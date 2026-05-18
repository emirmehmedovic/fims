/**
 * Next.js Instrumentation
 *
 * This file runs once when the server starts up
 * Used for initialization tasks like environment validation
 */

import { validateEnv } from './lib/config/env'

export function register() {
  // Validate environment variables on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv()
  }
}
