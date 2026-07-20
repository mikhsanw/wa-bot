module.exports = {
  apps: [
    {
      name: "laundry",
      script: "src/index.ts",
      cwd: "/home/laundr33/wa.laundry24.id",
      interpreter: "./node_modules/.bin/tsx",
      env: {
        NODE_ENV: "production",
        PORT: 5001
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      out_file: "./logs/laundry-out.log",
      error_file: "./logs/laundry-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
