# DreamsPOS Visual Parity Checklist

This checklist defines the rigorous design verification criteria for ensuring 100% visual and interactive parity between the original licensed DreamsPOS template and the production full-stack React implementation.

## 1. Design Tokens & Color Fidelity

| Token / Element | Template Value | React Implementation Token | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Brand Primary** | `#FE9F43` | `$primary: #FE9F43` | ✅ Verified | DreamsPOS signature orange |
| **Brand Secondary**| `#092C4C` | `$secondary: #092C4C` | ✅ Verified | Deep navy header/accent |
| **Success Color** | `#3EB780` | `$success: #3EB780` | ✅ Verified | Badges, success alerts |
| **Info Color** | `#155EEF` | `$info: #155EEF` | ✅ Verified | Informational tags |
| **Warning Color** | `#FFCA18` | `$warning: #FFCA18` | ✅ Verified | Due alerts, pending status |
| **Danger Color** | `#FF0000` | `$danger: #FF0000` | ✅ Verified | Stock alerts, void actions |
| **Dark Base** | `#1B2850` | `$dark: #1B2850` | ✅ Verified | Dark mode background/sidebar |
| **Light Background**| `#F9FAFB` | `$light: #F9FAFB` | ✅ Verified | App workspace background |
| **Primary Tints** | `#FFF6EE` to `#FFA95B` | `$primary-100` - `$primary-900` | ✅ Verified | Hover & active chip fills |
| **Typography Fonts**| Poppins, Nunito, Inter | Original licensed `.ttf` / `.woff` | ✅ Verified | Loaded from `assets/fonts` |
| **Box Shadows** | `0px 4px 24px rgba(223, 225, 230, 0.5)` | `$card-shadow` in SCSS | ✅ Verified | Exact card elevation |

---

## 2. Layouts & Viewport Modes

| Layout Variation | Target Visual Behavior | Responsive Breakpoints | Status |
| :--- | :--- | :--- | :---: |
| **Default Vertical** | Fixed sidebar (260px), sticky header (60px), scrollable body | Desktop (>=1200px) | ✅ In Place |
| **Mini / Collapsed** | 80px slim sidebar, flyout tooltips on hover | Desktop (>=1200px) | ✅ In Place |
| **Horizontal Navigation** | Top-level horizontal menu with multi-tier dropdowns | Desktop (>=1200px) | ✅ In Place |
| **Two-Column Sidebar** | Primary icon bar (80px) + secondary accordion panel (200px) | Desktop (>=1200px) | ✅ In Place |
| **Detached Layout** | Floating navbar & boxed content container | Desktop (>=1200px) | ✅ In Place |
| **Boxed / Without Header**| Kiosk full-screen mode with bottom bar | Desktop & POS screens | ✅ In Place |
| **RTL Layout** | Mirrored direction (`dir="rtl"`), flipped chevrons & margins | All viewports | ✅ In Place |
| **Dark Theme** | High-contrast dark surfaces (`#1B2850`), light text | All viewports | ✅ In Place |
| **Tablet Landscape** | Collapsible drawer, 2-column dashboard grids | 1024px | ✅ In Place |
| **Tablet Portrait** | Off-canvas drawer on hamburger click | 768px | ✅ In Place |
| **Mobile Screen** | Single-column stack, mobile sticky checkout button | 390px - 430px | ✅ In Place |

---

## 3. POS Billing Screen Layouts (POS 1 through 8)

| POS Layout | Layout Characteristics | Verification Viewport | Status |
| :--- | :--- | :--- | :---: |
| **POS 1 (Standard)** | Left product grid (3-4 cols), right cart panel (sticky summary) | 1440px & 1024px | 🟡 Testing |
| **POS 2 (Wide Grid)** | Full width product catalog with quick-slide bottom cart | 1440px | 🟡 Testing |
| **POS 3 (Split Touch)** | Center product cards, right order details, left category bar | 1024px | 🟡 Testing |
| **POS 4 (Grocery / High Density)**| Tabular SKU input, quick price-entry keypad, compact line items | 1440px | 🟡 Testing |
| **POS 5 (Restaurant / Table)**| Table selector modal, course notes, kitchen order ticket (KOT) | 1440px & 1024px | 🟡 Testing |
| **POS 6 (Self-Service Kiosk)**| Large touch buttons, simplified tap-to-add, payment card prompt | 1080x1920 (Portrait) | 🟡 Testing |
| **POS 7 (Express Lane)** | Single-row scanning feed with immediate tender keys | 1440px | 🟡 Testing |
| **POS 8 (Mobile / Handheld)** | Vertical swipe feed, sticky bottom bar with cart count and checkout | 390px | 🟡 Testing |

---

## 4. UI Components & Micro-Interactions

| Component | Visual & Functional Criteria | Parity Status |
| :--- | :--- | :---: |
| **Headers & Topbar** | Search autocomplete, store switcher, language flags, user menu, notification bell with unread badge | ✅ Verified |
| **Sidebar Menu** | Expandable accordions, active highlight pill, badges for counts | ✅ Verified |
| **Statistic Widgets** | Summary counters (`Total Sales`, `Total Purchases`, `Profit`), percentage trend chips (`+12.5%`) | ✅ Verified |
| **Charts** | ApexCharts line/bar with exact DreamsPOS gradient fills and tooltips | ✅ Verified |
| **Data Tables** | Pagination controls, length selector, column sorting chevrons, bulk selection checkboxes | ✅ Verified |
| **Modals** | Centered modal headers with orange theme border, close button, smooth fade-in | ✅ Verified |
| **Offcanvas Panels** | Slide from right (filters, cart details, held orders) with backdrop overlay | ✅ Verified |
| **Thermal Receipt** | Monospace typography, dashed divider lines, aligned tabular pricing, barcode at footer | ✅ Verified |
