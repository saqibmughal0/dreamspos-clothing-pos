const fs = require('fs');

const content = fs.readFileSync('apps/web/src/core/modals/pos-modal/posModals.jsx', 'utf8');
const idRegex = /id=["']([^"']+)["']/g;
const ids = new Set();
let match;
while ((match = idRegex.exec(content)) !== null) {
  ids.add(match[1]);
}
console.log('PosModals modal IDs:', Array.from(ids));
