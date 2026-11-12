const fs = require('fs');
const path = require('path');

const migDir = path.resolve(__dirname, '../prisma/migrations');

if (!fs.existsSync(migDir)) {
  console.error(`[Pre-Deploy Check FAILED] Migrations directory not found at: ${migDir}`);
  process.exit(1);
}

const entries = fs.readdirSync(migDir, { withFileTypes: true });
const migrationDirs = entries.filter(e => e.isDirectory());
const sqlFiles = migrationDirs.filter(d => fs.existsSync(path.join(migDir, d.name, 'migration.sql')));

if (sqlFiles.length === 0) {
  console.error(`[Pre-Deploy Check FAILED] No migration.sql files found under ${migDir}!`);
  process.exit(1);
}

console.log(`[Pre-Deploy Check OK] Found ${sqlFiles.length} migration(s) in ${migDir}:`);
for (const m of sqlFiles) {
  console.log(`  - ${m.name}/migration.sql`);
}
