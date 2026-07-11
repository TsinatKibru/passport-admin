# Quick Start Guide

## ✅ What Was Built

A **design-system-first admin dashboard** with:
- Clean, professional UI with proper spacing and typography
- Reusable component library (Card, Badge, Table, Button, Input, etc.)
- Responsive layout shell (Sidebar + Header + Main)
- 7 functional pages connected to the backend API
- Real-time data with 5-second polling

## 🚀 Run the Dashboard

```bash
cd /home/calm/flutterproejcts/passport-track/passport-track-admin
npm run dev
```

Visit: **http://localhost:3001**

## 🔐 Login

**Test Credentials:**
- Email: `admin@passport-track.com`
- Password: `adminpass`

**Backend Required:**
The API must be running on `http://localhost:3000/api`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Dashboard (KPI cards + box table)
│   ├── login/page.tsx            # Login page
│   ├── passports/page.tsx        # Passport management
│   ├── boxes/page.tsx            # Box management
│   ├── structure/page.tsx        # Physical structure tree
│   ├── logs/page.tsx             # Audit logs timeline
│   ├── setup/page.tsx            # Setup page
│   ├── layout.tsx                # Root layout (DO NOT MODIFY)
│   ├── providers.tsx             # TanStack Query config (DO NOT MODIFY)
│   └── globals.css               # Design tokens (Inter font, CSS vars)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # 240px left nav
│   │   ├── Header.tsx            # 60px top bar
│   │   └── Shell.tsx             # Layout wrapper
│   │
│   └── ui/
│       ├── Card.tsx              # White elevated panel
│       ├── Badge.tsx             # Status pills (6 variants)
│       ├── Table.tsx             # Data table components
│       ├── Button.tsx            # 4 variants, 2 sizes
│       ├── Input.tsx             # Form input
│       ├── PageHeader.tsx        # Page title + action
│       └── StatCard.tsx          # KPI metric card
│
└── lib/
    └── api/client.ts             # Axios singleton (DO NOT MODIFY)
```

## 🎨 Design Tokens

All visual properties use CSS variables from `globals.css`:

### Colors
- `--brand` → Primary blue (#2563EB)
- `--success` → Green (#16A34A)
- `--warning` → Orange (#D97706)
- `--danger` → Red (#DC2626)
- `--bg-page` → Light gray (#F8FAFC)
- `--bg-surface` → White (#FFFFFF)
- `--text-primary` → Dark slate (#0F172A)
- `--text-muted` → Gray (#94A3B8)

### Spacing
- `--sidebar-width` → 240px
- Page padding → 24px
- Card padding → 20px (default)
- Component gap → 16px

### Borders & Shadows
- `--radius` → 8px
- `--radius-lg` → 12px
- `--shadow-sm` → Subtle elevation
- `--border` → Light gray (#E2E8F0)

## 📊 Pages Overview

### 1. Dashboard (`/`)
- 4 KPI stat cards (Total, Occupied, Vacant, Occupancy %)
- Movable box overview table
- Search box
- Refresh button

### 2. Passports (`/passports`)
- Full passport records table
- Search and status filter
- Color-coded status badges

### 3. Boxes (`/boxes`)
- All boxes with utilization metrics
- "+ Add Box" action button

### 4. Structure (`/structure`)
- Two-column layout
- Tree view (left): Room hierarchy
- Detail panel (right): Selected item details

### 5. Logs (`/logs`)
- Timeline feed with vertical line
- Log cards with action badges
- Progressive opacity for older entries

### 6. Setup (`/setup`)
- Configuration placeholder

### 7. Login (`/login`)
- Centered form card
- Error handling
- Auto-redirect if authenticated

## 🔄 Data Flow

1. **Auth**: JWT stored in `localStorage` as `accessToken`
2. **API**: All requests via `apiClient` (auto-attaches JWT)
3. **Queries**: TanStack Query with 5-second polling
4. **Guards**: All pages except `/login` check for token

## 🛠️ Adding Features

### To Add a New Page:

1. Create `src/app/your-page/page.tsx`
2. Wrap content in `<Shell title="Your Title">`
3. Add to sidebar navigation in `Sidebar.tsx`
4. Use existing UI components

### To Add a Component:

1. Create in `src/components/ui/YourComponent.tsx`
2. Use CSS variables for styling
3. Follow existing patterns (props, exports)

### To Modify Colors:

1. Edit CSS variables in `src/app/globals.css`
2. Changes propagate to entire app

## ⚠️ Hard Rules

**DO NOT MODIFY:**
- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/lib/api/client.ts`

**ALWAYS:**
- Use `apiClient` for API calls
- Set `refetchInterval: 5000` on queries
- Check auth token on page mount
- Use CSS variables for colors/spacing
- Import UI components from `@/components/ui/`

## 🔍 Troubleshooting

### "Cannot GET /" after login
- Backend API not running on port 3000
- Check: `http://localhost:3000/api/boxes`

### Build errors
- Run: `npm run build`
- Check TypeScript errors
- Verify all imports

### Styles not applying
- Check Google Fonts import is FIRST line in globals.css
- Verify CSS variables are defined in `:root`

### Auth redirect loop
- Clear localStorage: `localStorage.clear()`
- Restart dev server

## 📚 Dependencies

- **Next.js 16** (App Router)
- **React 19**
- **TanStack Query 5** (5-second polling)
- **Axios** (HTTP client)
- **Lucide React** (icons)
- **Recharts** (future charts)
- **Tailwind CSS 4** (utility classes)
- **TypeScript 5**

## ✨ What Makes This Different

**Design System First:**
- Foundation built before features
- CSS tokens drive all styling
- Reusable component library
- Professional visual hierarchy

**Clean Code:**
- Zero TypeScript errors
- Proper separation of concerns
- Consistent patterns
- Well-documented

**Production Ready:**
- Successful build
- Auth guards
- Error handling
- Real-time updates

---

## 🎯 Next Steps

The foundation is complete. You can now:
1. Add charts using recharts
2. Implement CRUD modals
3. Add advanced filters
4. Expand detail views
5. Add file uploads
6. Implement batch operations

The design system ensures all additions will be consistent and professional.
