module.exports = {
  apps : [{
    name: "perimeter-server",
    cwd: '/usr/share/nginx/html',
    script: "./dist/bin/www.js",
    args: 'start',
    watch: true,
    env: {
      NODE_ENV: "development",
      PORT: '3005',
    },
  }]
}
