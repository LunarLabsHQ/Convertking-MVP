module.exports = {
  apps: [{
    name: 'convertking-server',
    script: './server-hono.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
