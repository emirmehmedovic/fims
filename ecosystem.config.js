/**
 * PM2 Ecosystem Configuration File
 *
 * Production configuration for FIMS application
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 */

module.exports = {
  apps: [{
    name: 'fims',
    script: 'npm',
    args: 'start',
    cwd: '/home/fims/apps/fims',  // Change this to your actual path

    // Cluster mode for better performance
    instances: 2,  // Adjust based on CPU cores (2x cores recommended)
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Logging
    error_file: '/home/fims/logs/fims-error.log',  // Change to your log path
    out_file: '/home/fims/logs/fims-out.log',      // Change to your log path
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Behavior
    autorestart: true,
    max_memory_restart: '1G',  // Restart if memory exceeds 1GB
    watch: false,              // Don't watch files in production
    time: true,                // Prefix logs with timestamp

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Advanced features
    min_uptime: '10s',         // Min uptime before considering app stable
    max_restarts: 10,          // Max restarts within min_uptime

    // Cron restart (optional - restart every day at 4am)
    // cron_restart: '0 4 * * *',

    // Post-deploy hooks (optional)
    // post_update: ['npm install', 'npm run build'],
  }]
}
