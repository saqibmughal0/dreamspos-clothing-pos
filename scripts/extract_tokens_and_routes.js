const fs = require('fs');
const path = require('path');

const htmlTemplateDir = path.join(__dirname, '..', 'original_template', 'html', 'html', 'template');
const reactTemplateDir = path.join(__dirname, '..', 'original_template', 'react', 'template');

console.log('=== ANALYZING SCSS VARIABLES & DESIGN TOKENS ===');
const scssVarsPath = path.join(htmlTemplateDir, 'assets', 'scss', 'utils', '_variables.scss');
if (fs.existsSync(scssVarsPath)) {
  const scssVars = fs.readFileSync(scssVarsPath, 'utf8');
  console.log('Found SCSS Variables in HTML template:');
  const colorLines = scssVars.split('\n').filter(l => l.trim().startsWith('$') && (l.includes('#') || l.includes('rgb') || l.includes('color')));
  console.log(colorLines.slice(0, 30).join('\n'));
} else {
  console.log('Checking alternative scss paths...');
  const findScss = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(findScss(full));
      } else if (file.endsWith('.scss')) {
        results.push(full);
      }
    }
    return results;
  };
  const scssFiles = findScss(path.join(htmlTemplateDir, 'assets', 'scss'));
  console.log('SCSS files found:', scssFiles.map(f => path.basename(f)));
}

console.log('\n=== ANALYZING REACT ROUTES & STRUCTURE ===');
const routerDir = path.join(reactTemplateDir, 'src', 'Router');
if (fs.existsSync(routerDir)) {
  console.log('Router files:', fs.readdirSync(routerDir));
  const routerAll = fs.readdirSync(routerDir).filter(f => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'));
  for (const rf of routerAll) {
    const content = fs.readFileSync(path.join(routerDir, rf), 'utf8');
    const routeMatches = content.match(/path:\s*['"][^'"]+['"]/g) || [];
    console.log(`Routes in ${rf}: ${routeMatches.length}`);
  }
}

console.log('\n=== ANALYZING SIDEBAR NAVIGATION ===');
const sidebarDir = path.join(reactTemplateDir, 'src', 'InitialPage', 'Sidebar');
if (fs.existsSync(sidebarDir)) {
  console.log('Sidebar directory files:', fs.readdirSync(sidebarDir));
}

// Analyze sidebar JSON data if available
const jsonDir = path.join(reactTemplateDir, 'src', 'core', 'json');
if (fs.existsSync(jsonDir)) {
  console.log('JSON data files in core/json:', fs.readdirSync(jsonDir));
}
