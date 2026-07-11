# Passport Track Admin Dashboard

Modern administrative dashboard for the ICS Passport & Movable Box Tracking System.

## 🎯 Features

- **Real-time Dashboard** - Live KPI metrics with 5-second polling
- **Physical Structure Management** - Hierarchical view of Rooms → Shelves → Rows → Slots
- **Movable Box Tracking** - Complete box inventory with occupancy metrics
- **Passport Management** - Track passport status and assignments
- **Audit Trail** - Live log feed of all system activities
- **ICS Design System** - Government-grade interface with Ethiopian flag colors

## 🛠️ Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **TanStack Query** (5-second polling)
- **Lucide React** (icons)
- **Axios** (HTTP client with JWT interceptor)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running on `http://localhost:3000/api`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## 🔐 Authentication

**Test Credentials:**
- Email: `admin@passport-track.com`
- Password: `adminpass`

JWT token stored in `localStorage` as `accessToken`.

## 📁 Project Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── page.tsx               # Main dashboard (redesigned)
│   ├── layout.tsx             # Root layout with Providers
│   ├── providers.tsx          # TanStack Query setup
│   └── globals.css            # CSS tokens & Tailwind imports
└── lib/
    └── api/
        └── client.ts          # Axios singleton with JWT interceptor
```

## 🎨 Design System

### Colors

- **Primary**: `#003ec7` (ICS Blue)
- **Success**: `hsl(156, 100%, 31%)` (Ethiopian Green)
- **Warning**: `hsl(42, 90%, 46%)` (Ethiopian Yellow)  
- **Danger**: `hsl(359, 86%, 52%)` (Ethiopian Red)
- **Background**: `#FAFAFA`

### Dashboard Views

1. **Dashboard** - KPI overview + box table
2. **Physical Structure** - Hierarchical tree view
3. **Movable Boxes** - Grid of all boxes
4. **Passports** - Table of all passports
5. **Audit Logs** - Timeline feed

## 🔌 API Integration

All endpoints accessed through `apiClient` from `@/lib/api/client`:

- `GET /boxes` - List all boxes
- `GET /passports` - List all passports
- `GET /location/rooms` - List rooms
- `GET /location/shelves` - List shelves
- `GET /location/rows` - List rows
- `GET /location/slots` - List slots (with nested box data)
- `GET /location/logs` - Paginated audit logs
- `POST /auth/login` - Authentication

## ⚙️ Configuration

**Environment Variables:**

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Defaults to `http://localhost:3000/api` if not set.

## 📝 Notes

- Design based on Figma exports from `stitch_passport_custody_tracking_system`
- ICS (Immigration and Citizenship Service) branding applied
- 5-second polling for real-time updates (can be upgraded to WebSockets)
- Auth guard protects all routes except `/login`

## 📄 License

Private - ICS Internal Use Only
