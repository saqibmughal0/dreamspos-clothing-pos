const fs = require('fs');
const path = require('path');

const pageDetails = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'page_details.json'), 'utf8'));
const inventoryMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'inventory_mapping.json'), 'utf8'));

// Group by category
const grouped = {};
for (const p of pageDetails) {
  const mapItem = inventoryMapping.find(m => m.htmlFile === p.file) || {};
  const category = mapItem.category || 'Other';
  if (!grouped[category]) grouped[category] = [];
  grouped[category].push({
    ...p,
    route: mapItem.matchedRoute || `/${p.baseName}`
  });
}

let md = `# DreamsPOS Complete Page Inventory\n\n`;
md += `**Total Scanned HTML Template Pages:** ${pageDetails.length}\n`;
md += `**Source Directory:** \`original_template/html/html/template/\`\n`;
md += `**Target Route System:** React Router v6 in \`apps/web/src/Router\`\n\n`;

md += `## Summary by Category\n\n`;
md += `| Category | Total Pages | Has Forms | Has Tables | Has Modals | Has Charts |\n`;
md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

for (const [cat, pages] of Object.entries(grouped)) {
  const forms = pages.filter(p => p.hasForm).length;
  const tables = pages.filter(p => p.hasTable).length;
  const modals = pages.filter(p => p.hasModal).length;
  const charts = pages.filter(p => p.hasApexChart).length;
  md += `| **${cat}** | ${pages.length} | ${forms} | ${tables} | ${modals} | ${charts} |\n`;
}

md += `\n---\n\n`;

for (const [cat, pages] of Object.entries(grouped)) {
  md += `## ${cat} (${pages.length} Pages)\n\n`;
  md += `| # | HTML File | Target Route | Page Title / Purpose | Table | Form | Modal | Chart |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n`;
  pages.forEach((p, idx) => {
    md += `| ${idx + 1} | \`${p.file}\` | \`${p.route}\` | ${p.title.replace(/\|/g, '-')} | ${p.hasTable ? '✅' : '—'} | ${p.hasForm ? '✅' : '—'} | ${p.hasModal ? '✅' : '—'} | ${p.hasApexChart ? '✅' : '—'} |\n`;
  });
  md += `\n`;
}

fs.writeFileSync(path.join(__dirname, '..', 'PAGE_INVENTORY.md'), md);
fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'PAGE_INVENTORY.md'), md);
console.log('PAGE_INVENTORY.md generated successfully.');
