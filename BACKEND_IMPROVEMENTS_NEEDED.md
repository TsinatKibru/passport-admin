# Backend API Improvements Needed for Scale

## Critical Issue: Slot Picker Cannot Scale

### Current State:
The `/location/slots` endpoint does NOT support:
- `?search=` parameter
- `?page=` and `?limit=` parameters  
- Paginated response format

### Current API:
```
GET /location/slots          → Slot[] (ALL slots, no pagination)
GET /location/slots?rowId=X  → Slot[] (slots for specific row)
```

### Problem:
In a large facility with 1000+ slots:
- Frontend must fetch ALL 1000+ slots
- Must filter client-side
- Must paginate client-side
- Slow, memory-intensive, doesn't scale

### Professional Solution Required:
```
GET /location/slots?page=1&limit=15&search=A1

Response:
{
  data: Slot[],      // 15 slots max
  total: 456,        // Total matching
  page: 1,
  limit: 15,
  totalPages: 31
}
```

### Backend Changes Needed:
1. Add `search` query param - search by:
   - slot.name
   - slot.qrCode
   - room.name, shelf.name, row.name (nested)

2. Add `page` and `limit` query params

3. Return paginated response format (same as boxes/passports/logs)

4. Add database indexes on searchable fields

### Estimated Effort:
- 15-20 minutes of backend work
- Follows existing pagination pattern from boxes/passports endpoints

---

## Other Potential Scale Issues

### 1. Available Boxes Endpoint (`/boxes/available`)
**Current:** No pagination, returns all available boxes  
**Risk:** Low - filtered by `neededSpaces`, result set usually small  
**Action:** Monitor - add pagination if > 100 results typical

### 2. Location Hierarchy Endpoints
**Current:** No pagination on rooms/shelves/rows  
**Risk:** Low - bounded by facility size, loaded incrementally  
**Action:** OK as-is (lazy loading pattern is correct)

### 3. Dashboard Stats (`/dashboard/stats`)
**Current:** Returns aggregate counts  
**Risk:** None - no data arrays  
**Action:** OK as-is

---

## Temporary Frontend Workaround

Until backend supports slot pagination:
- ✅ Fetch all slots when modal opens
- ✅ Filter client-side (instant)
- ✅ Paginate client-side (15 per page)
- ✅ Works fine for facilities with < 500 slots
- ❌ Will be slow/unusable for > 1000 slots

**Current Implementation:** `src/app/boxes/page.tsx` lines 140-175

---

## When to Implement

**Priority: HIGH** (before deployment to large facilities)

**Timeline:**
- Small pilot (< 200 slots): Current implementation OK
- Medium facility (200-500 slots): Current implementation acceptable
- Large facility (500+ slots): MUST implement backend pagination

**Recommendation:**  
Add backend pagination support in next sprint before scaling beyond pilot.
