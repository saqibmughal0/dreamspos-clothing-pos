const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientDir = path.resolve(__dirname, '../node_modules/.prisma/client');

if (fs.existsSync(clientDir)) {
  try {
    const entries = fs.readdirSync(clientDir);
    for (const name of entries) {
      if (name.includes('.tmp')) {
        try {
          fs.unlinkSync(path.join(clientDir, name));
        } catch (_) {}
      }
    }
  } catch (_) {}
}

try {
  process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = 'true';
  const prismaBin = path.resolve(__dirname, '../node_modules/.bin/prisma');
  const command = fs.existsSync(prismaBin) || fs.existsSync(`${prismaBin}.cmd`)
    ? `"${prismaBin}" generate`
    : 'npx prisma generate';

  execSync(command, {
    stdio: 'inherit',
    env: process.env,
    cwd: path.resolve(__dirname, '..')
  });
} catch (err) {
  if (fs.existsSync(path.join(clientDir, 'index.d.ts'))) {
    console.log('[Prisma Generate] Prisma Client types are already generated and up-to-date.');
  } else {
    console.error('[Prisma Generate] Generation failed and no existing client was found:', err);
    process.exit(1);
  }
}
