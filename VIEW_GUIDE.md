# Dashboard View Guide

This document describes each view in the redesigned admin dashboard.

## Navigation Structure

The dashboard uses a **single-page application** approach with client-side view switching:

```
Sidebar Navigation
├── Dashboard (Overview) ← Default view
├── Physical Structure Tree
├── Movable Boxes
├── Passport Management
└── Audit Logs
```

---

## View 1: Dashboard (Overview)

**Route:** `/` (default view when `activeView === 'dashboard'`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: "Dashboard Overview & Statistics"                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │ Total     │ │ Occupied  │ │ Vacant    │ │ Occupancy │  │
│  │ Boxes     │ │ Boxes     │ │ Boxes     │ │ Rate      │  │
│  │    120    │ │    85     │ │    35     │ │  70.83%   │  │
│  │ [=======] │ │ [======= ]│ │ [===    ] │ │  [icon]   │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Movable Box Overview                  [Search] [+] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Box ID    │ Location      │ Occ │ Vac │ Status    │   │
│  ├───────────┼───────────────┼─────┼─────┼───────────┤   │
│  │ BX-2024-  │ Room A / S01  │ 20  │  0  │ [FULL]    │   │
│  │ BX-2024-  │ Room A / S01  │ 12  │  8  │ [ACTIVE]  │   │
│  │ BX-2024-  │ Room B / S04  │  0  │ 20  │ [INACTIVE]│   │
│  │   ...     │               │     │     │           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **KPI Cards** (4 metrics)
   - Large numeric display (48px font)
   - Progress bar visualization
   - Icon in top-right corner
   - Hover effect (border changes to primary blue)

2. **Box Overview Table**
   - Search input (styled with left icon)
   - Add button (primary blue)
   - Table columns:
     - Box ID (monospace, blue text)
     - Location String (hierarchical path)
     - Occupied Slots (center-aligned)
     - Vacant Slots (center-aligned)
     - Status Badge (right-aligned)
   - Pagination controls at bottom

---

## View 2: Physical Structure Tree

**Route:** `/` (when `activeView === 'hierarchy'`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: "Physical Structure Tree"                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Storage Facility Hierarchy                    [+ New Slot] │
│  Central Repository System (CRS-01)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [📁] Secure Archive Room 01    [ROOM_ID: A01]      │   │
│  │      - 3 Shelves                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [📁] Standard Storage Room 02  [ROOM_ID: B01]      │   │
│  │      - 5 Shelves                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Room Cards**
  - Folder icon
  - Room name (bold)
  - QR code badge
  - Shelf count
  - Hover effect (background changes)

- **Empty State**
  - Displays when no rooms exist
  - Folder icon (large, gray)
  - Message: "No Rooms Configured"

---

## View 3: Movable Boxes Grid

**Route:** `/` (when `activeView === 'boxes'`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: "Movable Box Management"                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  All Movable Boxes                                          │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │BX-2024-  │ │BX-2024-  │ │BX-2024-  │ │BX-2024-  │      │
│  │   001    │ │   002    │ │   003    │ │   004    │      │
│  │ [FULL]   │ │ [ACTIVE] │ │ [ACTIVE] │ │ [FULL]   │      │
│  │          │ │          │ │          │ │          │      │
│  │ Box A    │ │ Box B    │ │ Box C    │ │ Box D    │      │
│  │ 20 / 20  │ │ 12 / 20  │ │  0 / 20  │ │ 18 / 20  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   ...    │ │   ...    │ │   ...    │ │   ...    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Box Cards** (Grid: 3 columns on large screens)
  - QR Code (monospace, bold, blue)
  - Status badge (top-right)
  - Box label
  - Capacity metric (occupied / total)
  - Border highlight on hover

---

## View 4: Passport Management

**Route:** `/` (when `activeView === 'passports'`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: "Passport Management"                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Passport Management                                        │
│  Manage and track physical passport assets                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ QR     │ Name          │ ID      │ Box    │ Status │   │
│  ├────────┼───────────────┼─────────┼────────┼────────┤   │
│  │ PP-001 │ ALEX VORONOV  │ ID-8829 │ BOX-A2 │ IN_BOX │   │
│  │ PP-002 │ ELENA MARTIN  │ ID-4112 │   —    │UNASSIG │   │
│  │ PP-003 │ MARCUS CHEN   │ ID-9901 │ BOX-B4 │ ISSUED │   │
│  │   ...  │               │         │        │        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Data Table**
  - QR Code column
  - Holder Name (bold)
  - Holder ID (monospace, gray)
  - Current Box (blue, can be linked)
  - Status Badge:
    - `IN_BOX` → Blue badge
    - `ISSUED` → Green badge
    - `UNASSIGNED` → Orange badge
  - Alternating row backgrounds
  - Hover effect on rows

---

## View 5: Audit Logs Timeline

**Route:** `/` (when `activeView === 'logs'`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: "Audit Trail Logs"                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [●] Live Audit Log Feed                                    │
│      (pulsing red dot)                                      │
│                                                              │
│  │                                                           │
│  ├──[●]─┐                                                   │
│  │      │ [ASSIGNED] Location Finalized                    │
│  │      │ 14:22:05 | 24 OCT 2023                           │
│  │      │ ┌─────────────────────────────────────┐          │
│  │      │ │ TARGET: PP-A1001                    │          │
│  │      │ │ CONTAINER: MB-0003                  │          │
│  │      │ │ LOCATION: Slot A-01-B               │          │
│  │      │ └─────────────────────────────────────┘          │
│  │      │ By: Admin S. Miller                              │
│  │                                                           │
│  ├──[○]─┐ (opacity: 90%)                                   │
│  │      │ [MOVED] Inter-Shelf Transfer                     │
│  │      │ 14:15:30 | 24 OCT 2023                           │
│  │      │ "Batch reallocation for diplomatic upgrade"      │
│  │      │ Slot A-02-C → Slot A-01-B                        │
│  │                                                           │
│  ├──[○]─┐ (opacity: 70%)                                   │
│  │      │ [ISSUED] Temporary Checkout                      │
│  │      │ 13:50:11 | 24 OCT 2023                           │
│  │                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Timeline Visualization**
  - Vertical connecting line (left side)
  - Circular node indicators
  - Latest entry fully opaque
  - Progressive opacity for older entries

- **Log Entry Cards**
  - Timestamp (monospace, small, gray)
  - Action badge (blue background)
  - Event title (bold)
  - Details box (code block style):
    - Target passport
    - Container box
    - Location
  - User attribution (small text)
  - Shadow on hover

---

## Color Legend

### Status Badges

| Status      | Background Color | Text Color | Border     |
|-------------|------------------|------------|------------|
| ACTIVE      | `#003ec7/10`     | `#003ec7`  | None       |
| FULL        | `#ba1a1a/10`     | `#ba1a1a`  | None       |
| INACTIVE    | `#5f5e60/10`     | `#5f5e60`  | None       |
| IN_BOX      | `blue-50`        | `blue-700` | `blue-200` |
| ISSUED      | `green-50`       | `green-700`| `green-200`|
| UNASSIGNED  | `orange-50`      | `orange-700`|`orange-200`|

### Action Types

- **ASSIGNED** → Primary blue badge
- **MOVED** → Secondary gray badge
- **ISSUED** → Tertiary red badge
- **CREATED** → Success green badge

---

## Responsive Behavior

### Desktop (≥1024px)
- Full sidebar (240px)
- KPI cards in 4 columns
- Box grid in 3 columns
- Tables fully expanded

### Tablet (768px - 1023px)
- Full sidebar
- KPI cards in 2 columns
- Box grid in 2 columns
- Horizontal scroll on tables

### Mobile (<768px)
- Collapsed sidebar recommended
- KPI cards stacked (1 column)
- Box grid in 1 column
- Tables with horizontal scroll

---

## Interactive Elements

### Hover States
- KPI cards → border changes to primary blue
- Table rows → background changes to light surface
- Buttons → opacity/background changes
- Sidebar items → background lightens

### Active States
- Sidebar navigation → left border accent + light background
- Current view → highlighted in sidebar
- Selected table row → (can be added later)

### Loading States
- Handled by TanStack Query
- 5-second polling keeps data fresh
- No explicit loading spinners shown (seamless updates)

---

## Data Polling

All views automatically refresh every **5 seconds** via TanStack Query:

```typescript
defaultOptions: {
  queries: {
    refetchInterval: 5_000,  // 5 seconds
    staleTime: 4_000,
  },
}
```

This creates a "live dashboard" feel without WebSockets.
