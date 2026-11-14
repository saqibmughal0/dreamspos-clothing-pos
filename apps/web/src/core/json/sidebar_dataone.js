



export const SidebarData1 = [

  {
    tittle: 'Main Menu',
    hasSubRoute: true,
    icon: 'layout-grid',
    showSubRoute: false,
    subRoutes: [
      {
        tittle: 'Dashboard',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/index",
        customSubmenuTwo: false,
      },
    ],
  },
  
  {
    tittle: 'Inventory',
    hasSubRoute: true,
    icon: 'brand-unity',
    showSubRoute: false,
    activeRoute: 'product',
    subRoutes: [
      {
        tittle: 'Products',
        hasSubRoute: false,
        showSubRoute: true,
        route: "/product-list",
        subRoutes: [],
      },
      {
        tittle: 'Create Product',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/add-product",
        subRoutes: [],
      },
      {
        tittle: 'Expired Products',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/expired-products",
        subRoutes: [],
      },
      {
        tittle: 'Low Stocks',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/low-stocks",
        subRoutes: [],
      },
      {
        tittle: 'Category',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/category-list",
        subRoutes: [],
      },
      {
        tittle: 'Sub Category',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/sub-categories",
        subRoutes: [],
      },
      {
        tittle: 'Brands',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/brand-list",
        subRoutes: [],
      },
      {
        tittle: 'Units',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/units",
        subRoutes: [],
      },
      {
        tittle: 'Variant Attributes',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/variant-attributes",
        subRoutes: [],
      },
      {
        tittle: 'Warranties',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/warranty",
        subRoutes: [],
      },
      {
        tittle: 'Print Barcode',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/barcode",
        subRoutes: [],
      },
      {
        tittle: 'Print QR Code',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/qrcode",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: 'Sales & Purchase',
    hasSubRoute: true,
    icon: 'layout-grid',
    showSubRoute: false,
    activeRoute: 'users',
    subRoutes: [
      {
        tittle: 'Stock',
        hasSubRoute: true,
        showSubRoute: false,
        subRoutes: [
          {
            tittle: 'Manage Stock',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/manage-stocks",
            subRoutes: [],
          },
          {
            tittle: 'Stock Adjustment',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/stock-adjustment",
            subRoutes: [],
          },
          {
            tittle: 'Stock Transfer',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/stock-transfer",
            subRoutes: [],
          },
        ],
      },
      {
        tittle: 'Sales',
        hasSubRoute: true,
        showSubRoute: false,
        route: "/sales-list",
        subRoutes: [
          {
            tittle: 'Sales',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'Online Orders',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/online-orders",
                subRoutes: [],
              },
              {
                tittle: 'POS Orders',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/pos-orders",
                subRoutes: [],
              },
            ],
          },
          {
            tittle: 'Invoice',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/invoice-settings",
            subRoutes: [],
          },
          {
            tittle: 'Sales Return',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/sales-returns",
            subRoutes: [],
          },
          {
            tittle: 'Quotation',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/quotation-list",
            subRoutes: [],
          },
          {
            tittle: 'POS',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/pos",
            subRoutes: [],
          },
        ],
      },
      {
        tittle: 'Promo',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'promo',
        subRoutes: [
          {
            tittle: 'Coupons',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/coupons",
            subRoutes: [],
          },
          {
            tittle: 'Gift Cards',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/gift-cards",
            subRoutes: [],
          },
          {
            tittle: 'Discount',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'Discount Plan',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/discount-plan",
                subRoutes: [],
              },
              {
                tittle: 'Discount',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/discount",
                subRoutes: [],
              },
            ],
          },
        ],
      },
      {
        tittle: 'Purchases',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'users',
        subRoutes: [
          {
            tittle: 'Purchases',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/purchase-list",
            subRoutes: [],
          },
          {
            tittle: 'Purchase Order',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/purchase-order-report",
            subRoutes: [],
          },
          {
            tittle: 'Purchase Return',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/purchase-returns",
            subRoutes: [],
          },
          {
            tittle: 'Expenses',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'Expenses',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/expense-list",
                subRoutes: [],
              },
              {
                tittle: 'Expense Category',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/expense-category",
                subRoutes: [],
              },
            ],
          },

        ],
      },
      {
        tittle: 'Expenses',
        hasSubRoute: true,
        showSubRoute: true,
        //   route: routes.stockTransfer,
        subRoutes: [
          {
            tittle: 'Expenses',
            route: "/expense-list",
          },
          {
            tittle: 'Expense Category',
            route: "/expense-category",
          },
        ],
      },
      {
        tittle: 'Income',
        hasSubRoute: true,
        showSubRoute: false,
        route: "/purchase-returns",
        subRoutes: [
          {
            tittle: 'Income',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/income",
            subRoutes: [],
          },
          {
            tittle: 'Income Category',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/income-category",
            subRoutes: [],
          },
        ],
      },
      {
        tittle: 'Bank Accounts',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/account-list",
        subRoutes: [],
      },
      {
        tittle: 'Money Transfer',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/money-transfer",
        subRoutes: [],
      },
      {
        tittle: 'Balance Sheet',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/balance-sheet",
        subRoutes: [],
      },
      {
        tittle: 'Trial Balance',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/trial-balance",
        subRoutes: [],
      },
      {
        tittle: 'Cash Flow',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/cash-flow",
        subRoutes: [],
      },
      {
        tittle: 'Account Statement',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/account-statement",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: 'HRM',
    hasSubRoute: true,
    icon: 'users',
    showSubRoute: false,
    subRoutes: [
      {
        tittle: 'Employees',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.purchaseReport,
        subRoutes: [
          {
            tittle: 'Employees',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/employees-grid",
            subRoutes: [],
          },
          {
            tittle: 'Designations',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/designation",
            subRoutes: [],
          },
          {
            tittle: 'Departments',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/department-grid",
            subRoutes: [],
          },
          {
            tittle: 'Shifts',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/shift",
            subRoutes: [],
          }

        ],
      },
      {
        tittle: 'Attendance',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.purchaseReport,
        subRoutes: [
          {
            tittle: 'Employee Attendance',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/attendance-employee",
            subRoutes: [],
          },
          {
            tittle: 'Admin Attendance',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/attendance-admin",
            subRoutes: [],
          },
        ],
      },
      {
        tittle: 'Leave & Holidays',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.purchaseReport,
        subRoutes: [
          {
            tittle: 'Admin Leaves',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/leaves-admin",
            subRoutes: [],
          },
          {
            tittle: 'Employee Leaves',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/leaves-employee",
            subRoutes: [],
          },
          {
            tittle: 'Leave Types',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/leave-types",
            subRoutes: [],
          },
          {
            tittle: 'Holidays',
            hasSubRoute: true,
            showSubRoute: false,
            route: "/holidays",
            subRoutes: [],
          },
          {
            tittle: 'Payroll',
            hasSubRoute: true,
            showSubRoute: true,
            route: "/employee-salary",
            subRoutes: [
              {
                tittle: 'Employee Salary',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/employee-salary",
                subRoutes: [],
              },
              {
                tittle: 'Payslip',
                hasSubRoute: false,
                showSubRoute: false,
                route: "/payslip",
                subRoutes: [],
              }
            ],
          },
        ],
      },
    ],
  },
  {
    tittle: 'Reports',
    hasSubRoute: true,
    icon: 'chart-bar',
    showSubRoute: false,
    activeRoute: 'users',
    subRoutes: [
      {
        tittle: 'Sales Report',
        hasSubRoute: true,
        showSubRoute: true,
        subRoutes: [
          {
            tittle: 'Sales Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/sales-report",
          },
          {
            tittle: 'Best Seller',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/best-seller",
          },
        ],
      },
      {
        tittle: 'Purchase Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/purchase-report",
        subRoutes: [],
      },
      {
        tittle: 'Inventory Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/inventory-report",
        subRoutes: [
          {
            tittle: 'Inventory Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/inventory-report",
            subRoutes: []
          },
          {
            tittle: 'Stock History',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/stock-history",
            subRoutes: []
          },
          {
            tittle: 'Sold Stock',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/sold-stock",
            subRoutes: []
          },
        ],
      },
      {
        tittle: 'Invoice Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/invoice-report",
        subRoutes: [],
      },
      {
        tittle: 'Supplier Report',
        hasSubRoute: true,
        showSubRoute: true,
        subRoutes: [
          {
            tittle: 'Supplier Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/supplier-report",
            subRoutes: []
          },
          {
            tittle: 'Supplier Due Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/supplier-due-report",
            subRoutes: []
          },
        ],
      },

      {
        tittle: 'Customer Report',
        hasSubRoute: false,
        showSubRoute: false,
        subRoutes: [
          {
            tittle: 'Customer Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/customer-report",
            subRoutes: []
          },
          {
            tittle: 'Customer Due Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/customer-due-report",
            subRoutes: []
          },
        ],
      },
      {
        tittle: 'Product Report',
        hasSubRoute: false,
        showSubRoute: false,
        subRoutes: [
          {
            tittle: 'Product Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/product-report",
            subRoutes: []
          },
          {
            tittle: 'Product Expiry Report',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/product-expiry-report",
            subRoutes: []
          },
          {
            tittle: 'Product Quantity Alert',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/product-quantity-alert",
            subRoutes: []
          },
        ],
      },
      {
        tittle: 'Expense Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/expense-report",
        subRoutes: [],
      },
      {
        tittle: 'Income Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/income-report",
        subRoutes: [],
      },
      {
        tittle: 'Tax Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/tax-report",
        subRoutes: [],
      },
      {
        tittle: 'Profit & Loss',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/profit-and-loss",
        subRoutes: [],
      },
      {
        tittle: 'Annual Report',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/annual-report",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: 'Settings',
    hasSubRoute: true,
    icon: 'settings',
    showSubRoute: false,
    activeRoute: 'users',
    subRoutes: [
      {
        tittle: 'Profile',
        route: "/profile",
        hasSubRoute: false,
        showSubRoute: false,
      },
      {
        tittle: 'General Settings',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.users,
        subRoutes: [
          {
            tittle: 'Profile',
            route: "/profile",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Security',
            route: "/security-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Notifications',
            route: "/notification",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Connected Apps',
            route: "/connected-apps",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },
      {
        tittle: 'Website Settings',
        hasSubRoute: true,
        showSubRoute: false,
        subRoutes: [
          {
            tittle: 'System Settings',
            route: "/system-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Company Settings',
            route: "/company-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Localization',
            route: "/localization-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Prefixes',
            route: "/prefixes",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Preference',
            route: "/preference",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Appearance',
            route: "/appearance",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Social Authentication',
            route: "/social-authentication",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Language',
            route: "/language-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },

      {
        tittle: 'App Settings',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'users',
        subRoutes: [
          {
            tittle: 'Invoice',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'Invoice Settings',
                route: "/invoice-settings",
                hasSubRoute: true,
                showSubRoute: true,
                subRoutes: [],
              },
              {
                tittle: 'Invoice Template',
                route: "/invoice-template",
                hasSubRoute: true,
                showSubRoute: true,
                subRoutes: [],
              },
            ],
          },
          {
            tittle: 'Printer',
            route: "/printer-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'POS',
            route: "/pos-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Custom Fields',
            route: "/custom-fields",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },
      {
        tittle: 'System Settings',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'users',
        subRoutes: [
          {
            tittle: 'Email',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'Email Settings',
                route: "/email-settings",
                hasSubRoute: false,
                showSubRoute: false,
              },
              {
                tittle: 'Email Template',
                route: "/email-template",
                hasSubRoute: false,
                showSubRoute: false,
              },

            ],
          },
          {
            tittle: 'SMS',
            hasSubRoute: true,
            showSubRoute: true,
            subRoutes: [
              {
                tittle: 'SMS Settings',
                route: "/sms-settings",
                hasSubRoute: false,
                showSubRoute: false,
              },
              {
                tittle: 'SMS Template',
                route: "/sms-template",
                hasSubRoute: false,
                showSubRoute: false,
              },
            ]
          },
          {
            tittle: 'OTP',
            route: "/otp-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'GDPR Cookies',
            route: "/gdpr-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },
      {
        tittle: 'Financial Settings',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'users',
        subRoutes: [
          {
            tittle: 'Payment Gateway',
            route: "/payment-gateway-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Bank Accounts',
            route: "/bank-settings-grid",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Tax Rates',
            route: "/tax-rates",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Currencies',
            route: "/currency-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },
      {
        tittle: 'Other Settings',
        hasSubRoute: true,
        showSubRoute: false,
        activeRoute: 'users',
        subRoutes: [
          {
            tittle: 'Storage',
            route: "/storage-settings",
            hasSubRoute: false,
            showSubRoute: false,
          },
          {
            tittle: 'Ban IP Address',
            route: "/ban-ip-address",
            hasSubRoute: false,
            showSubRoute: false,
          },
        ],
      },
      {
        tittle: 'Logout',
        hasSubRoute: false,
        showSubRoute: false,
        route: "/signin",
      },
      
    ],
  },
  {
    tittle: 'More',
    hasSubRoute: true,
    icon: 'circle-plus',
    showSubRoute: false,
    activeRoute: 'More',
    subRoutes: [

      {
        tittle: 'People',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.users,
        subRoutes: [
          {
            tittle: 'Customers',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/customers",
            subRoutes: [],
          },
          {
            tittle: 'Billers',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/billers",
            subRoutes: [],
          },
          {
            tittle: 'Suppliers',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/suppliers",
            subRoutes: [],
          },
          {
            tittle: 'Stores',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/store-list",
            subRoutes: [],
          },
          {
            tittle: 'Warehouses',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/warehouse",
            subRoutes: [],
          },
        ],
      },
      {
        tittle: 'User Management',
        hasSubRoute: true,
        showSubRoute: false,
        //   route: routes.users,
        subRoutes: [
          {
            tittle: 'Users',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/users",
            subRoutes: [],
          },
          {
            tittle: 'Roles & Permissions',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/roles-permissions",
            subRoutes: [],
          },
          {
            tittle: 'Delete Account Request',
            hasSubRoute: false,
            showSubRoute: false,
            route: "/delete-account",
            subRoutes: [],
          },
        ],
      },
     
      {
        tittle: 'Documentation',
        hasSubRoute: false,
        showSubRoute: false,
        activeRoute: 'users',
      },
      {
        tittle: 'Changelog v2.0.7',
        hasSubRoute: false,
        showSubRoute: false,
        activeRoute: 'users',
      },
    ],
  },

];
