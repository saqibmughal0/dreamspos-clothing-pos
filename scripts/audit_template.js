const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '..', 'original_template', 'html', 'html', 'template');

if (!fs.existsSync(templateDir)) {
  console.error('Template dir not found:', templateDir);
  process.exit(1);
}

const files = fs.readdirSync(templateDir);
const htmlFiles = files.filter(f => f.endsWith('.html')).sort();

console.log(`Found ${htmlFiles.length} HTML files.`);

// Let's inspect CSS and SCSS variables
const scssDir = path.join(templateDir, 'assets', 'scss');
const cssDir = path.join(templateDir, 'assets', 'css');
const jsDir = path.join(templateDir, 'assets', 'js');
const imgDir = path.join(templateDir, 'assets', 'img');
const pluginsDir = path.join(templateDir, 'assets', 'plugins');

console.log('SCSS exists:', fs.existsSync(scssDir));
console.log('CSS exists:', fs.existsSync(cssDir));
console.log('JS exists:', fs.existsSync(jsDir));
console.log('IMG exists:', fs.existsSync(imgDir));
console.log('PLUGINS exists:', fs.existsSync(pluginsDir));

// Scan for sidebar structure from admin-dashboard.html or index.html or dashboard.html
const sampleHtmlFile = htmlFiles.includes('index.html') ? 'index.html' : (htmlFiles.includes('admin-dashboard.html') ? 'admin-dashboard.html' : htmlFiles[0]);
console.log('Using sample file for navigation inspection:', sampleHtmlFile);

const sampleContent = fs.readFileSync(path.join(templateDir, sampleHtmlFile), 'utf8');

// Extract sidebar links
const sidebarRegex = /<div class="sidebar"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i;
const sidebarMatch = sampleContent.match(sidebarRegex);
console.log('Sidebar found:', !!sidebarMatch);

// Save list of all HTML files
fs.writeFileSync(path.join(__dirname, '..', 'all_html_files.json'), JSON.stringify(htmlFiles, null, 2));

// Summary of categories
const categories = {
  dashboards: [],
  pos: [],
  products_inventory: [],
  sales: [],
  purchases: [],
  finance_accounts: [],
  people: [],
  hrm: [],
  reports: [],
  settings: [],
  cms: [],
  user_management: [],
  super_admin: [],
  application_pages: [],
  auth_system: [],
  ui_elements: []
};

for (const file of htmlFiles) {
  if (file.startsWith('pos')) {
    categories.pos.push(file);
  } else if (file.includes('dashboard')) {
    categories.dashboards.push(file);
  } else if (file.includes('product') || file.includes('category') || file.includes('brand') || file.includes('unit') || file.includes('warranty') || file.includes('barcode') || file.includes('qrcode') || file.includes('varriant')) {
    categories.products_inventory.push(file);
  } else if (file.includes('sales') || file.includes('invoice') || file.includes('quotation') || file.includes('order')) {
    categories.sales.push(file);
  } else if (file.includes('purchase')) {
    categories.purchases.push(file);
  } else if (file.includes('expense') || file.includes('income') || file.includes('account') || file.includes('balance') || file.includes('cash-flow') || file.includes('tax') || file.includes('trial-balance') || file.includes('profit-and-loss')) {
    categories.finance_accounts.push(file);
  } else if (file.includes('customer') || file.includes('supplier') || file.includes('biller') || file.includes('store') || file.includes('warehouse')) {
    categories.people.push(file);
  } else if (file.includes('employee') || file.includes('department') || file.includes('designation') || file.includes('shift') || file.includes('attendance') || file.includes('holiday') || file.includes('leave') || file.includes('payroll') || file.includes('salary')) {
    categories.hrm.push(file);
  } else if (file.includes('report')) {
    categories.reports.push(file);
  } else if (file.includes('settings') || file.includes('appearance') || file.includes('localization') || file.includes('preference') || file.includes('ban-ip') || file.includes('custom-fields') || file.includes('gdpr') || file.includes('storage') || file.includes('security') || file.includes('profile')) {
    categories.settings.push(file);
  } else if (file.includes('blog') || file.includes('page') || file.includes('faq') || file.includes('testimonial') || file.includes('countr') || file.includes('state') || file.includes('cit')) {
    categories.cms.push(file);
  } else if (file.includes('user') || file.includes('role') || file.includes('permission') || file.includes('delete-account')) {
    categories.user_management.push(file);
  } else if (file.includes('company') || file.includes('domain') || file.includes('subscription') || file.includes('package')) {
    categories.super_admin.push(file);
  } else if (file.includes('signin') || file.includes('register') || file.includes('forgot-password') || file.includes('reset-password') || file.includes('verification') || file.includes('lock-screen') || file.includes('error-') || file.includes('success') || file.includes('coming-soon') || file.includes('under-maintenance')) {
    categories.auth_system.push(file);
  } else if (file.startsWith('ui-') || file.startsWith('form-') || file.startsWith('chart-') || file.startsWith('icon-') || file.startsWith('table') || file.includes('data-tables')) {
    categories.ui_elements.push(file);
  } else {
    categories.application_pages.push(file);
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'template_categories.json'), JSON.stringify(categories, null, 2));

console.log('Categories categorized successfully.');
for (const [cat, items] of Object.entries(categories)) {
  console.log(`- ${cat}: ${items.length} files`);
}
