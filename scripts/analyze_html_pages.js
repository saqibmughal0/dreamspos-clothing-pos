const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '..', 'original_template', 'html', 'html', 'template');
const reactDir = path.join(__dirname, '..', 'original_template', 'react', 'template');

const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html')).sort();

// Inspect all HTML pages for components (tables, forms, modals, charts, filters)
const pageDetails = [];
for (const file of htmlFiles) {
  const filePath = path.join(htmlDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : file;

  const hasTable = /<table\b/i.test(content);
  const hasForm = /<form\b/i.test(content) || /class="[^"]*form-[^"]*"/i.test(content);
  const hasModal = /class="[^"]*modal\b[^"]*"/i.test(content);
  const hasApexChart = /id="[^"]*chart[^"]*"/i.test(content) || /apexcharts/i.test(content);
  const hasFilter = /class="[^"]*filter-[^"]*"/i.test(content) || /btn-filter/i.test(content);
  const hasCard = /class="[^"]*card\b[^"]*"/i.test(content);

  // Identify module category
  const baseName = file.replace('.html', '');
  pageDetails.push({
    file,
    baseName,
    title,
    hasTable,
    hasForm,
    hasModal,
    hasApexChart,
    hasFilter,
    hasCard
  });
}

fs.writeFileSync(path.join(__dirname, '..', 'page_details.json'), JSON.stringify(pageDetails, null, 2));
console.log(`Analyzed ${pageDetails.length} pages.`);
