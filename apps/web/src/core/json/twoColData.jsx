import { all_routes } from "../../Router/all_routes";

const routes = all_routes;

export const TowColData = [
    {
        tittle: 'Main',
        icon: 'airplay',
        showAsTab: true,
        showMyTab:true,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Dashboard',
            route: routes.adminDashboard,
            hasSubRoute: true,
            showSubRoute: false,
            icon: 'smart-home',
            base: 'dashboard',
            materialicons: 'home',
            subMenus: [
              {
                menuValue: 'Dashboard',
                route: routes.adminDashboard,
                base: 'index',
              },
              {
                menuValue: 'Employee Dashboard',
                route: routes.employeeDashboard,
                base: 'employee',
              },
              {
                menuValue: 'Deals Dashboard',
                route: routes.dealsDashboard,
                base: 'deals',
              },
              {
                menuValue: 'Leads Dashboard',
                route: routes.leadsDashboard,
                base: 'leads',
              },
            ],
          },
        ],
      },
      {
        tittle: 'Projects',
        icon: 'layers',
        showAsTab: false,
        separateRoute: false,
        base: 'projects',
        menu: [
          {
            menuValue: 'Projects',
            hasSubRouteTwo: true,
            showSubRoute: false,
            icon: 'users-group',
            base: 'client',
            base2:'projects',
            materialicons: 'dashboard',
            subMenus: [
              {
                menuValue: 'Clients',
                route: routes.clientgrid,
                base: 'client',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Projects',
                base: 'project',
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Projects',
                    route: routes.project,
                    base: 'project-grid',
                    base2: 'project-list',
                    base3: 'project-details',
                  },
                  { menuValue: 'Tasks', route: routes.tasks, base: 'tasks' },
                  {
                    menuValue: 'Task Board',
                    route: routes.taskboard,
                    base: 'task-board',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        tittle: 'Crm',
        icon: 'file',
        showAsTab: false,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Crm',
            hasSubRouteTwo: true,
            showSubRoute: false,
            icon: 'user-shield',
            base: 'crm',
            materialicons: 'dashboard',
            subMenus: [
              {
                menuValue: 'Contacts',
                route: routes.contactList,
                base: 'contact',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Companies',
                route: routes.companiesGrid,
                base: 'company',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Deals',
                route: routes.dealsList,
                base: 'deals',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Leads',
                route: routes.leadsList,
                base: 'leads',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Pipeline',
                route: routes.pipeline,
                base: 'pipeline',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Analytics',
                route: routes.analytics,
                base: 'analytics',
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Activities',
                route: routes.activities,
                base: 'activities',
                customSubmenuTwo: false,
              },
            ],
          },
        ],
      },
      {
        tittle: 'Hrm',
        icon: 'file',
        showAsTab: false,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Hrm',
            hasSubRouteTwo: true,
            showSubRoute: false,
            icon: 'user',
            base: 'employees',
            base2:'tickets',
            base3:'holidays',
            base4: 'attendance',
            base5: 'performance',
            base7: 'trainings',
            materialicons: 'dashboard',
            subMenus: [
              {
                menuValue: 'Employees',
                route: routes.employeeList,
                hasSubRoute: true,
                customSubmenuTwo: true,
                showSubRoute: false,
                base: 'employees',
                subMenusTwo: [
                  {
                    menuValue: 'Employees List',
                    route: routes.employeeList,
                    base: 'employees',
                    base2: 'employee-list',
                  },
                  {
                    menuValue: 'Employees Grid',
                    route: routes.employeeGrid,
                    base: 'employees',
                    base2: 'employee-grid',
                  },
                  {
                    menuValue: 'Employees Details',
                    route: routes.employeedetails,
                    base: 'employees',
                    base2: 'employee-details',
                  },
                  {
                    menuValue: 'Departments',
                    route: routes.departments,
                    base: 'departments',
                  },
                  {
                    menuValue: 'Designations',
                    route: routes.designations,
                    base: 'designations',
                  },
                  {
                    menuValue: 'Policies',
                    route: routes.policy,
                    base: 'employees',
                    base2: 'policy',
                  },
                ],
              },
              {
                menuValue: 'Tickets',
                route: routes.ticketList,
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                base: 'tickets',
                subMenusTwo: [
                  {
                    menuValue: 'Tickets',
                    route: routes.ticketList,
                    base: 'tickets',
                    base2:'ticket-list'
                  },
                  {
                    menuValue: 'Tickets Detail',
                    route: routes.ticketDetails,
                    base: 'ticket-details',
                  },
                ],
              },
  
              {
                menuValue: 'Holidays',
                route: routes.holidays,
                base: 'holidays',
                hasSubRoute: false,
                showSubRoute: false,
                customSubmenuTwo: false,
              },
              {
                menuValue: 'Attendance',
                route: routes.attendanceadmin,
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                base: 'attendance',
                subMenusTwo: [
                  {
                    menuValue: 'Leaves (Admin)',
                    route: routes.leaveadmin,
                    hasSubRoute: false,
                    showSubRoute: false,
                    base:'leave-admin'
                  },
                  {
                    menuValue: 'Leaves (Employee)',
                    route: routes.leaveemployee,
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                  {
                    menuValue: 'Leave Settings',
                    route: routes.leavesettings,
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                  {
                    menuValue: 'Attendance (Admin)',
                    route: routes.attendanceadmin,
                    base: 'attendance-admin',
                    customSubmenuTwo: false,
                  },
                  {
                    menuValue: 'Attendance (Employee)',
                    route: routes.attendanceemployee,
                    base: 'attendance-employee',
                    customSubmenuTwo: false,
                  },
  
                  {
                    menuValue: 'Timesheet',
                    route: routes.timesheet,
                    base: 'timesheet',
                    customSubmenuTwo: false,
                  },
                  {
                    menuValue: 'Shift & Schedule',
                    route: routes.scheduletiming,
                    base: 'shift-schedule',
                    customSubmenuTwo: false,
                  },
                  {
                    menuValue: 'Overtime',
                    route: routes.overtime,
                    base: 'overtime',
                    customSubmenuTwo: false,
                  },
                ],
              },
              {
                menuValue: 'Performance',
                route: routes.performanceIndicator,
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                base: 'performance',
                subMenusTwo: [
                  {
                    menuValue: 'Performance Indicator',
                    route: routes.performanceIndicator,
                    base: 'indicator',
                  },
                  {
                    menuValue: 'Performance Review',
                    route: routes.performanceReview,
                    base: 'review',
                  },
                  {
                    menuValue: 'Performance Appraisal',
                    route: routes.performanceAppraisal,
                    base: 'appraisal',
                  },
                  {
                    menuValue: 'Goal List',
                    route: routes.goalTracking,
                    base: 'appraisal',
                  },
                  {
                    menuValue: 'Goal Type',
                    route: routes.goalType,
                    base: 'appraisal',
                  },
                ],
              },
              {
                menuValue: 'Training',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                base: 'trainings',
                subMenusTwo: [
                  {
                    menuValue: 'Training List',
                    route: routes.trainingList,
                    base: 'training-list',
                  },
                  {
                    menuValue: 'Trainers',
                    route: routes.trainers,
                    base: 'trainers',
                  },
                  {
                    menuValue: 'Training Type',
                    route: routes.trainingType,
                    base: 'types',
                  },
                ],
              },
              {
                menuValue: 'Promotion',
                route: routes.promotion,
                hasSubRoute: false,
                showSubRoute: false,
                base: 'promotion',
              },
              {
                menuValue: 'Resignation',
                route: routes.resignation,
                hasSubRoute: false,
                showSubRoute: false,
                base: 'resignation',
              },
              {
                menuValue: 'Termination',
                route: routes.termination,
                hasSubRoute: false,
                showSubRoute: false,
                base: 'termination',
              },
            ],
          },
        ],
      },
  
      {
        tittle: 'Finance & Accounts',
        icon: 'file',
        showAsTab: false,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Finance & Accounts',
            route: routes.pages,
            hasSubRouteTwo: true,
            showSubRoute: false,
            icon: 'shopping-cart-dollar',
            base: 'sales',
            base2:'accounting',
            base3:'payroll',
            materialicons: 'dashboard',
            subMenus: [
              {
                menuValue: 'Sales',
                base: 'sales',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Estimates',
                    route: routes.estimate,
                    base: '/sales/estimates',
                  },
                  {
                    menuValue: 'Invoices',
                    route: routes.invoice,
                    base: '/sales/invoices',
                  },
                  {
                    menuValue: 'Payments',
                    route: routes.payments,
                    base: '/sales/payments',
                  },
                  {
                    menuValue: 'Expenses',
                    route: routes.expenses,
                    base: '/sales/expenses',
                  },
                  {
                    menuValue: 'Provident Fund',
                    route: routes.providentfund,
                    base: '/sales/provident-fund',
                  },
                  {
                    menuValue: 'Taxes',
                    route: routes.taxes,
                    base: '/sales/taxes',
                  },
                ],
              },
              {
                menuValue: 'Accounting',
                base: 'accounting',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Categories',
                    route: routes.categories,
                    base: '/accounting/categories',
                  },
                  {
                    menuValue: 'Budgets',
                    route: routes.budgets,
                    base: '/accounting/budgets',
                  },
                  {
                    menuValue: 'Budget Expenses',
                    route: routes.budgetexpenses,
                    base: '/accounting/budget-expenses',
                  },
                  {
                    menuValue: 'Budget Revenues',
                    route: routes.budgetrevenues,
                    base: '/accounting/budget-revenues',
                  },
                ],
              },
              {
                menuValue: 'Payroll',
                base: 'payroll',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Employee Salary',
                    route: routes.employeesalary,
                    base: '/payroll/employee-salary',
                  },
                  {
                    menuValue: 'Payslip',
                    route: routes.payslip,
                    base: '/payroll/payslip',
                  },
                  {
                    menuValue: 'Payroll Items',
                    route: routes.payrollAddition,
                    base: '/payroll/payroll',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        tittle: 'Administration',
        showAsTab: false,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Administration',
            hasSubRouteTwo: true,
            showSubRoute: false,
            icon: 'cash',
            base: 'assets',
            base2:'support',
            base3:'user-management',
            base4:'reports',
            base5:'settings',
            materialicons: 'dashboard',
            subMenus: [
              {
                menuValue: 'Assets',
                base: 'asset',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Assets',
                    route: routes.assetList,
                    base: '/asset/assets',
                  },
                  {
                    menuValue: 'Asset Categories',
                    route: routes.assetCategories,
                    base: '/asset/asset-categories',
                  },
                ],
              },
              {
                menuValue: 'Help & Supports',
                base: 'supports',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Knowledge Base',
                    route: routes.knowledgebase,
                    base: '/supports/knowledgebase',
                  },
                  {
                    menuValue: 'Activities',
                    route: routes.activities,
                    base: '/supports/activities',
                  },
                ],
              },
              {
                menuValue: 'User Management',
                base: 'user-management',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Users',
                    route: routes.manageusers,
                    base: '/user-management/users',
                  },
                  {
                    menuValue: 'Roles & Permissions',
                    route: routes.rolesPermissions,
                    base: '/user-management/roles-permissions',
                  },
                ],
              },
              {
                menuValue: 'Reports',
                base: 'reports',
                hasSubRoute: true,
                showSubRoute: false,
                customSubmenuTwo: true,
                subMenusTwo: [
                  {
                    menuValue: 'Expense Report',
                    route: routes.expensesreport,
                    base: '/reports/expenses-report',
                  },
                  {
                    menuValue: 'Invoice Report',
                    route: routes.invoicereport,
                    base: '/reports/invoice-report',
                  },
                  {
                    menuValue: 'Payment Report',
                    route: routes.paymentreport,
                    base: '/reports/payment-report',
                  },
                  {
                    menuValue: 'Project Report',
                    route: routes.projectreport,
                    base: '/reports/project-report',
                  },
                  {
                    menuValue: 'Task Report',
                    route: routes.taskreport,
                    base: '/reports/task-report',
                  },
                  {
                    menuValue: 'User Report',
                    route: routes.userreport,
                    base: '/reports/user-report',
                  },
                  {
                    menuValue: 'Employee Report',
                    route: routes.employeereport,
                    base: '/reports/employee-report',
                  },
                  {
                    menuValue: 'Payslip Report',
                    route: routes.payslipreport,
                    base: '/reports/payslip-report',
                  },
                  {
                    menuValue: 'Attendance Report',
                    route: routes.attendancereport,
                    base: '/reports/attendance-report',
                  },
                  {
                    menuValue: 'Leave Report',
                    route: routes.leavereport,
                    base: '/reports/leave-report',
                  },
                  {
                    menuValue: 'Daily Report',
                    route: routes.dailyreport,
                    base: '/reports/daily-report',
                  },
                ],
              },
              {
                menuValue: 'Profile',
                route: routes.profile,
                base: 'profile',
                hasSubRoute: false,
                showSubRoute: false,
              },
              {
                menuValue: 'General Settings',
                customSubmenuTwo: true,
                base: 'general-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Profile',
                    route: routes.profilesettings,
                    base: 'profile-settings',
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                  {
                    menuValue: 'Security',
                    route: routes.securitysettings,
                    base: 'security-settings',
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                  {
                    menuValue: 'Notifications',
                    route: routes.notificationssettings,
                    base: 'notification-settings',
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                  {
                    menuValue: 'Connected Apps',
                    route: routes.connectedApps,
                    base: 'connected-apps',
                    hasSubRoute: false,
                    showSubRoute: false,
                  },
                ],
              },
              {
                menuValue: 'Website Settings',
                customSubmenuTwo: true,
                base: 'website-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Business Settings',
                    route: routes.bussinessSettings,
                    base: 'bussiness-settings',
                  },
                  {
                    menuValue: 'SEO Settings',
                    route: routes.seoSettings,
                    base: 'seo-settings',
                  },
                  {
                    menuValue: 'Localization',
                    route: routes.localizationSettings,
                    base: 'localization-settings',
                  },
                  {
                    menuValue: 'Prefixes',
                    route: routes.prefixes,
                    base: 'prefixes',
                  },
                  {
                    menuValue: 'Preferences',
                    route: routes.preference,
                    base: 'preferences',
                  },
                  {
                    menuValue: 'Appearance',
                    route: routes.appearance,
                    base: 'appearance',
                  },
                  {
                    menuValue: 'Language',
                    route: routes.language,
                    base: 'language',
                    base2: 'add-language',
                  },
                  {
                    menuValue: 'Authentication',
                    route: routes.authenticationSettings,
                    base: 'authentication-settings',
                  },
                  {
                    menuValue: 'AI Settings',
                    route: routes.aiSettings,
                    base: 'ai-settings',
                  },
                ],
              },
              {
                menuValue: 'App Settings',
                customSubmenuTwo: true,
                base: 'app-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Salary Settings',
                    route: routes.salarySettings,
                    base: 'salary-settings',
                  },
                  {
                    menuValue: 'Approval Settings',
                    route: routes.approvalSettings,
                    base: 'approval-settings',
                  },
                  {
                    menuValue: 'Invoice Settings',
                    route: routes.invoiceSettings,
                    base: 'invoice-settings',
                  },
                  {
                    menuValue: 'Leave Type',
                    route: routes.leaveType,
                    base: 'leave-type',
                  },
                  {
                    menuValue: 'Custom Fields',
                    route: routes.customFields,
                    base: 'custom-fields',
                  },
                ],
              },
              {
                menuValue: 'System Settings',
                customSubmenuTwo: true,
                base: 'system-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Email Settings',
                    route: routes.emailSettings,
                    base: 'email-settings',
                  },
                  {
                    menuValue: 'Email Templates',
                    route: routes.emailTemplates,
                    base: 'email-template',
                  },
                  {
                    menuValue: 'SMS Settings',
                    route: routes.smsSettings,
                    base: 'sms-settings',
                  },
                  {
                    menuValue: 'SMS Templates',
                    route: routes.smsTemplate,
                    base: 'sms-template',
                  },
                  {
                    menuValue: 'OTP',
                    route: routes.otpSettings,
                    base: 'otp-settings',
                  },
                  {
                    menuValue: 'GDPR Cookies',
                    route: routes.gdprCookies,
                    base: 'gdpr',
                  },
                  {
                    menuValue: 'Maintenance Mode',
                    route: routes.maintenanceMode,
                    base: 'maintenance-mode',
                  },
                ],
              },
              {
                menuValue: 'Financial Settings',
                customSubmenuTwo: true,
                base: 'financial-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Payment Gateways',
                    route: routes.paymentGateways,
                    base: 'payment-gateways',
                  },
                  {
                    menuValue: 'Tax Rate',
                    route: routes.taxRates,
                    base: 'tax-rates',
                  },
                  {
                    menuValue: 'Currencies',
                    route: routes.currencies,
                    base: 'currencies',
                  },
                ],
              },
              {
                menuValue: 'Other Settings',
                customSubmenuTwo: true,
                base: 'other-settings',
                subMenusTwo: [
                  {
                    menuValue: 'Custom CSS',
                    route: routes.customCss,
                    base: 'custom-css',
                  },
                  {
                    menuValue: 'Custom JS',
                    route: routes.customJs,
                    base: 'custom-js',
                  },
                  {
                    menuValue: 'Cronjob',
                    route: routes.cronjob,
                    base: 'cronjob',
                  },
                  {
                    menuValue: 'Storage',
                    route: routes.storage,
                    base: 'storage-settings',
                  },
                  {
                    menuValue: 'Ban IP Address',
                    route: routes.banIpAddress,
                    base: 'ban-ip-address',
                  },
                  {
                    menuValue: 'Backup',
                    route: routes.backup,
                    base: 'backup',
                  },
                  {
                    menuValue: 'Clear Cache',
                    route: routes.clearcache,
                    base: 'clear-cache',
                  },
                ],
              },
            ],
          },
        ],
      },
];
