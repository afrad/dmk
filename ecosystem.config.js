module.exports = {
  apps: [{
    name: 'friday-prayer-app',
    script: 'npm',
    args: 'start',
    cwd: '/home/dmk/dmk',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/dmk/logs/app-error.log',
    out_file: '/home/dmk/logs/app-out.log',
    log_file: '/home/dmk/logs/app-combined.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}