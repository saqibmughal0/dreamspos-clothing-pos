const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'apps', 'web', 'src');
const nodeModulesDir = path.join(__dirname, '..', 'apps', 'web', 'node_modules');

const getFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
};

const files = getFiles(srcDir);
const externalImports = new Set();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const importMatches = [...content.matchAll(/import\s+(?:[\w*\s{},]*from\s+)?['"]([^'"]+)['"]/g)];
  for (const m of importMatches) {
    const imp = m[1];
    if (!imp.startsWith('.') && !imp.startsWith('/') && !imp.startsWith('@/')) {
      // It's a package or subpath
      const parts = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
      externalImports.add(parts);
    }
  }
}

const missing = [];
for (const pkg of Array.from(externalImports).sort()) {
  const pkgPath = path.join(nodeModulesDir, pkg);
  if (!fs.existsSync(pkgPath)) {
    missing.push(pkg);
  }
}

console.log('Total external packages referenced:', externalImports.size);
console.log('Missing packages in node_modules:', missing);
