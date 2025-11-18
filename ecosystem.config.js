module.exports = {
  apps: [{
    name: 'abc',
    script: 'npm',
    args: 'start',
    cwd: '/abc',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      DATABASE_URL: "postgres://admin:t*4CoBsB@72.61.172.3:5432/abc",
      DIRECT_URL: "postgres://admin:t*4CoBsB@72.61.172.3:5432/abc",
      AUTH_SECRET: "CyCQ25wB3z/lgIgBXvzma8Y6J6rjCuugs6a7YVKhzuU=",
      ADMIN_API_KEY: "2xrotFkCG+uxtL7LfHNr9ig/c+TGK3Zz5C2Iq69oRLw=",
      GOOGLE_CLIENT_ID: "1024391866060-kftttosm6u8uf30r57sd97nj8on6ics4.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "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",
      GITHUB_CLIENT_ID: "7ee10ad5605b984d9bfe",
      GITHUB_CLIENT_SECRET: "ce825b23efaf47cd5df03929ba0e43f8864663d2",
      RESEND_API_KEY: "re_Wp5chqcJ_BdU5sQQr5CzEiHoLrRAxN777",
      NEXT_PUBLIC_APP_URL: "https://www.altbet.casino",
      NEXTAUTH_URL: "https://www.altbet.casino",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_WmBkedgxpkGrfEt3_D4QXSKu2ldStYYBLQRRWCZczlmoF5G",
    },
    error_file: '/abc/logs/err.log',
    out_file: '/abc/logs/out.log',
    log_file: '/abc/logs/combined.log',
    time: true
  }]
};