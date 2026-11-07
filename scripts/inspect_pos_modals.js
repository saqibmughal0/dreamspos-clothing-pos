const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'apps', 'web', 'src', 'core', 'modals', 'pos-modal', 'posModals.jsx'), 'utf8');

const idMatches = [...content.matchAll(/id=['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log('Modal IDs in posModals.jsx:', Array.from(new Set(idMatches)));
