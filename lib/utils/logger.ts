/**
 * Structured Logger using Pino
 *
 * Provides structured logging with context and metadata
 * Replaces previous console.log wrapper with proper structured logging
 *
 * Migration from old logger:
 *   Before: logger.info('User logged in', userId)
 *   After:  logger.info({ userId }, 'User logged in')
 *
 * New capabilities:
 *   - Structured JSON logging in production
 *   - Pretty printing in development
 *   - Child loggers with context
 *   - Automatic error formatting
 */

import pino from 'pino'

// Configure logger based on environment
const isDevelopment = process.env.NODE_ENV === 'development'

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }),

  // Structured JSON in production
  ...(!isDevelopment && {
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() }
      }
    }
  }),

  // Base context
  base: {
    env: process.env.NODE_ENV || 'development'
  }
})

/**
 * Format error for structured logging
 */
export const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error as any)
    }
  }
  return { error: String(error) }
}

/**
 * Enhanced logger with backward compatibility
 */
export const logger = {
  /**
   * Log general information
   * @example logger.info({ userId: '123' }, 'User logged in')
   * @example logger.info('Simple message') // backward compatible
   */
  info: (msgOrObj: any, ...args: any[]) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.info(msgOrObj, ...args)
    } else {
      pinoLogger.info(msgOrObj, ...args)
    }
  },

  /**
   * Log warnings
   * @example logger.warn({ count: 4 }, 'Rate limit approaching')
   */
  warn: (msgOrObj: any, ...args: any[]) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.warn(msgOrObj, ...args)
    } else {
      pinoLogger.warn(msgOrObj, ...args)
    }
  },

  /**
   * Log errors
   * @example logger.error({ error: formatError(err) }, 'Database operation failed')
   */
  error: (msgOrObj: any, ...args: any[]) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.error(msgOrObj, ...args)
    } else {
      pinoLogger.error(msgOrObj, ...args)
    }
  },

  /**
   * Log debug information - only in development
   * @example logger.debug({ query: 'SELECT ...' }, 'Executing query')
   */
  debug: (msgOrObj: any, ...args: any[]) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.debug(msgOrObj, ...args)
    } else {
      pinoLogger.debug(msgOrObj, ...args)
    }
  },

  /**
   * Create a child logger with additional context
   * @example const authLogger = logger.child({ module: 'auth' })
   */
  child: (context: Record<string, any>) => {
    return pinoLogger.child(context)
  }
}

// Export pino instance for advanced usage
export default pinoLogger

/**
 * Usage Examples:
 *
 * // Simple messages (backward compatible):
 * logger.info('Server started')
 * logger.error('Connection failed')
 *
 * // Structured logging (recommended):
 * logger.info({ userId: '123', action: 'login' }, 'User logged in')
 * logger.error({ error: formatError(err), query }, 'Database error')
 * logger.warn({ remaining: 1, userId }, 'Rate limit warning')
 *
 * // Module-specific loggers:
 * const apiLogger = logger.child({ module: 'api' })
 * apiLogger.info({ method: 'POST', path: '/api/users' }, 'API request')
 *
 * // Error logging:
 * try {
 *   // ... code
 * } catch (error) {
 *   logger.error({ error: formatError(error) }, 'Operation failed')
 * }
 */
