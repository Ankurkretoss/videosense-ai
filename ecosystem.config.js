/**
 * PM2 process file for running VideoSense AI as a production service.
 *
 * One-time setup:
 *   npm install -g pm2        # if pm2 isn't installed yet
 *
 * Every deploy:
 *   npm run build              # Next.js needs a production build first
 *   pm2 start ecosystem.config.js
 *
 * Day to day:
 *   pm2 status                       # is it running
 *   pm2 logs videosense-ai           # tail logs
 *   pm2 restart videosense-ai        # after a new build
 *   pm2 stop videosense-ai
 *   pm2 save && pm2 startup           # keep it running across a server reboot
 */
module.exports = {
  apps: [
    {
      name: "videosense-ai",
      cwd: __dirname,
      // Points straight at the Next.js binary rather than "npm run start" so PM2
      // manages the real server process directly (correct restarts, signals, and
      // memory stats instead of an npm wrapper process in between).
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
