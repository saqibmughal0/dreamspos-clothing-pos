const fs = require('fs');
const path = require('path');

const reactDir = path.join(__dirname, '..', 'original_template', 'react', 'template');
const htmlDir = path.join(__dirname, '..', 'original_template', 'html', 'html', 'template');

// Read all_routes.jsx
const allRoutesContent = fs.readFileSync(path.join(reactDir, 'src', 'Router', 'all_routes.jsx'), 'utf8');
const routeMatches = [...allRoutesContent.matchAll(/(\w+):\s*["']([^"']+)["']/g)];
const reactRoutes = {};
for (const match of routeMatches) {
  reactRoutes[match[1]] = match[2];
}

console.log('Total mapped routes in all_routes.jsx:', Object.keys(reactRoutes).length);

// Read sidebar data
let sidebarDataContent = '';
if (fs.existsSync(path.join(reactDir, 'src', 'core', 'json', 'siderbar_data.jsx'))) {
  sidebarDataContent = fs.readFileSync(path.join(reactDir, 'src', 'core', 'json', 'siderbar_data.jsx'), 'utf8');
}
console.log('Sidebar data size:', sidebarDataContent.length);

// HTML template pages
const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html')).sort();
console.log('Total HTML pages:', htmlFiles.length);

// Let's create an inventory mapping
const inventory = [];
for (const htmlFile of htmlFiles) {
  const baseName = htmlFile.replace('.html', '');
  // find matching react route
  let matchedRoute = null;
  for (const [key, val] of Object.entries(reactRoutes)) {
    const routeSlug = val.replace(/^\//, '');
    if (routeSlug === baseName || routeSlug === baseName.replace(/-/g, '') || key.toLowerCase() === baseName.replace(/-/g, '').toLowerCase()) {
      matchedRoute = val;
      break;
    }
  }

  // Also check if component exists in feature-module
  inventory.push({
    htmlFile,
    baseName,
    matchedRoute: matchedRoute || `/${baseName}`,
    category: getCategory(baseName)
  });
}

function getCategory(name) {
  if (name.includes('dashboard') || name === 'index') return 'Dashboards';
  if (name.startsWith('pos')) return 'Point of Sale (POS)';
  if (name.includes('product') || name.includes('category') || name.includes('brand') || name.includes('unit') || name.includes('warranty') || name.includes('barcode') || name.includes('qrcode') || name.includes('varriant')) return 'Inventory Management';
  if (name.includes('stock')) return 'Stock Management';
  if (name.includes('sales') || name.includes('invoice') || name.includes('quotation') || name.includes('order')) return 'Sales Management';
  if (name.includes('coupon') || name.includes('gift-card') || name.includes('discount')) return 'Promotions';
  if (name.includes('purchase')) return 'Purchases';
  if (name.includes('expense') || name.includes('income') || name.includes('account') || name.includes('balance') || name.includes('cash-flow') || name.includes('trial-balance') || name.includes('profit-and-loss') || name.includes('money-transfer')) return 'Finance & Accounts';
  if (name.includes('customer') || name.includes('supplier') || name.includes('biller') || name.includes('store') || name.includes('warehouse')) return 'People Management';
  if (name.includes('employee') || name.includes('department') || name.includes('designation') || name.includes('shift') || name.includes('attendance') || name.includes('holiday') || name.includes('leave') || name.includes('payroll') || name.includes('salary')) return 'HRM';
  if (name.includes('report')) return 'Reports';
  if (name.includes('settings') || name.includes('appearance') || name.includes('localization') || name.includes('preference') || name.includes('ban-ip') || name.includes('custom-fields') || name.includes('gdpr') || name.includes('storage') || name.includes('security') || name.includes('profile')) return 'Settings';
  if (name.includes('blog') || name.includes('faq') || name.includes('testimonial') || name.includes('countr') || name.includes('state') || name.includes('cit')) return 'Content Management (CMS)';
  if (name.includes('user') || name.includes('role') || name.includes('permission') || name.includes('delete-account')) return 'User Management';
  if (name.includes('company') || name.includes('domain') || name.includes('subscription') || name.includes('package')) return 'Super Admin';
  if (name.includes('signin') || name.includes('register') || name.includes('forgot-password') || name.includes('reset-password') || name.includes('verification') || name.includes('lock-screen') || name.includes('error-') || name.includes('success') || name.includes('coming-soon') || name.includes('under-maintenance')) return 'Authentication & System';
  if (name.startsWith('ui-') || name.startsWith('form-') || name.startsWith('chart-') || name.startsWith('icon-') || name.startsWith('table') || name.includes('data-tables')) return 'UI Interface & Elements';
  return 'Application Pages';
}

fs.writeFileSync(path.join(__dirname, '..', 'inventory_mapping.json'), JSON.stringify(inventory, null, 2));
console.log('Saved inventory mapping.');

// Summary count by category
const catCounts = {};
for (const item of inventory) {
  catCounts[item.category] = (catCounts[item.category] || 0) + 1;
}
console.log('Category Counts:', catCounts);
