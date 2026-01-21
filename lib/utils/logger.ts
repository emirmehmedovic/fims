/**
 * Logger utility for development and production environments
 * In production, only errors are logged to console
 * Sensitive information should never be logged in production
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log general information - only in development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Log warnings - only in development
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },

  /**
   * Log errors - in both development and production
   * Note: Be careful not to log sensitive information
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Log debug information - only in development
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  },
}
