module.exports = {
  apps: [{
    name: "wa-bot",
    cwd: "/home/ubuntu/wa-bot",
    script: "npx",
    args: "tsx src/index.ts",
    interpreter: "none",
    env: {
      PORT: 5001,
      NODE_ENV: "development",
    }
  }]
};
