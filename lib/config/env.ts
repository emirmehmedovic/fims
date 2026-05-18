/**
 * Environment Variable Validation
 *
 * Validates required environment variables at application startup
 * Fails fast if critical configuration is missing
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  // Authentication
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'NextAuth base URL for callbacks'
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth secret for JWT signing'
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string'
  },

  // Email (optional for development)
  {
    name: 'EMAIL_SERVER_HOST',
    required: false,
    description: 'SMTP server host'
  },
  {
    name: 'EMAIL_SERVER_PORT',
    required: false,
    description: 'SMTP server port'
  },
  {
    name: 'EMAIL_SERVER_USER',
    required: false,
    description: 'SMTP username'
  },
  {
    name: 'EMAIL_SERVER_PASSWORD',
    required: false,
    description: 'SMTP password'
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    description: 'Email sender address'
  },

  // Optional
  {
    name: 'NEXT_PUBLIC_URL',
    required: false,
    description: 'Public URL for client-side use'
  }
]

/**
 * Validate environment variables
 * @throws Error if required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]

    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(`${envVar.name} - ${envVar.description}`)
      } else {
        warnings.push(`${envVar.name} - ${envVar.description}`)
      }
    }
  }

  // Log warnings for optional variables
  if (warnings.length > 0) {
    console.warn('[ENV] Optional environment variables not set:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    console.error('[ENV] Missing required environment variables:')
    missing.forEach(m => console.error(`  - ${m}`))
    throw new Error(
      `Missing ${missing.length} required environment variable(s). Check the logs above for details.`
    )
  }

  console.log('[ENV] ✓ All required environment variables are set')
}

/**
 * Get environment variable with runtime check
 * @throws Error if variable is not set
 */
export function getEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

/**
 * Get environment variable with default fallback
 */
export function getEnvWithDefault(name: string, defaultValue: string): string {
  const value = process.env[name]
  return value && value.trim() !== '' ? value : defaultValue
}
