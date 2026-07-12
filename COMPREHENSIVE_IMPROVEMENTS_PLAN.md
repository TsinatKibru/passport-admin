# Comprehensive Improvements Plan

## Overview
This document outlines all improvements needed based on user requirements:
1. Replace browser confirm() dialogs with custom modals
2. Implement soft delete (if necessary)
3. Fix box status logic (INACTIVE when not assigned to slot)
4. Fix slot "Available" display (should show occupied if has box)
5. Add bulk assign boxes to slots action
6. Update API contract to reflect current implementation

---

## Issue 1: Browser Confirm Dialogs → Custom Modals

### Current State
All delete/destructive actions use `window.confirm()` which looks unprofessional and inconsistent with the design system.

**Locations:**
- `/app/boxes/page.tsx:298` - Delete box
- `/app/passports/page.tsx:246` - Issue passport
- `/app/passports/page.tsx:252` - Delete passport
- `/app/structure/page.tsx:409` - Delete structure entities (rooms/shelves/rows/slots)
- `/app/security/page.tsx:54` - Change user role

### Solution
Create a reusable `ConfirmModal` component with:
- Professional styled modal (matches existing Card design)
- Title, message, and optional danger variant
- Two buttons: Cancel (secondary) and Confirm (primary/danger)
- Managed via React state

**Implementation:**
1. Create `/components/ui/ConfirmModal.tsx`
2. Replace all `window.confirm()` calls with modal state
3. Use danger variant for delete operations
4. Use primary variant for non-destructive confirmations (issue passport, change role)

---

## Issue 2: Soft Delete Implementation

### Current State
All delete operations are **hard deletes** - permanently remove records from database.

**Backend Endpoints:**
- `DELETE /boxes/:id` → `prisma.movableBox.delete()`
- `DELETE /passports/:id` → `prisma.passport.delete()`
- `DELETE /location/rooms/:id` → `prisma.room.delete()`
- `DELETE /location/shelves/:id` → `prisma.shelf.delete()`
- `DELETE /location/rows/:id` → `prisma.row.delete()`
- `DELETE /location/slots/:id` → `prisma.slot.delete()`

### Analysis: Is Soft Delete Necessary?

**Arguments FOR Soft Delete:**
- Audit trail preservation (who deleted what, when)
- Accidental deletion recovery
- Historical data integrity for reports
- Compliance requirements (government facility)

**Arguments AGAINST:**
- MovementLog already provides audit trail for box/passport movements
- Physical QR codes mean deleted entities shouldn't be recreated with same QR
- Safety validations prevent most accidental deletes
- Additional complexity in queries (must filter `WHERE deletedAt IS NULL`)

### Recommendation: **CONDITIONAL SOFT DELETE**

**Implement soft delete for:**
- ✅ **Passports** - Critical documents, need recovery option
- ✅ **Boxes** - Physical assets, might be temporarily out of service
- ❌ **Structure (rooms/shelves/rows/slots)** - Physical setup rarely changes, hard delete OK

### Implementation Plan (if approved)

#### 1. Schema Changes
```prisma
model Passport {
  // ... existing fields
  deletedAt DateTime?
  deletedBy String?
  deletedByUser User? @relation("DeletedPassports", fields: [deletedBy], references: [id])
}

model MovableBox {
  // ... existing fields
  deletedAt DateTime?
  deletedBy String?
  deletedByUser User? @relation("DeletedBoxes", fields: [deletedBy], references: [id])
}
```

#### 2. Backend Service Changes
- Add `softDelete(id, userId)` method
- Modify `findAll()` to exclude soft-deleted by default
- Add `findAllDeleted()` for admin recovery
- Add `restore(id)` method for recovery

#### 3. Frontend Changes
- Add "Deleted" tab/filter to view soft-deleted items
- Add "Restore" button for admins
- Keep "Delete" as soft delete (rename to "Archive"?)
- Add "Permanently Delete" for hard delete (admin only)

---

## Issue 3: Box Status Logic - INACTIVE When Not Assigned

### Current Problem
Box status is only `ACTIVE` or `FULL` based on occupancy. There's no automatic `INACTIVE` status when a box is not assigned to a slot (slotId === null).

**User Expectation:**
> "If a box is not assigned to a slot it should be inactive or sth else like that"

### Current Status Logic
```typescript
// location.service.ts
status: newOccupiedCount >= box.capacity ? 'FULL' : 'ACTIVE'
```

### Proposed New Logic
```typescript
// When box.slotId === null → INACTIVE
// When box.occupiedCount >= capacity → FULL
// Otherwise → ACTIVE

const computeBoxStatus = (box: { slotId: string | null; occupiedCount: number; capacity: number }) => {
  if (!box.slotId) return 'INACTIVE'; // Not placed in any slot
  if (box.occupiedCount >= box.capacity) return 'FULL'; // At capacity
  return 'ACTIVE'; // Has space and is placed
};
```

### Implementation Required

#### 1. Backend Changes
- `box.service.ts` - Update `create()` to set INACTIVE if no slotId
- `location.service.ts` - Update `moveBox()` to set ACTIVE when assigned to slot
- `location.service.ts` - Update `batchAssignPassportsToBox()` to respect INACTIVE check
- `location.service.ts` - Update status computation logic everywhere

#### 2. Frontend Changes
- Update box filters to include INACTIVE
- Update box badge colors (INACTIVE = gray/muted)
- Show "Not Assigned" instead of null location for INACTIVE boxes

#### 3. Migration Script
```sql
-- Set existing unassigned boxes to INACTIVE
UPDATE movable_boxes SET status = 'INACTIVE' WHERE slot_id IS NULL AND status != 'FULL';
```

---

## Issue 4: Slot Display - Show Occupied Status

### Current Problem
The structure page always shows slots as "Available" (green badge) even when a box is assigned to them.

**User Observation:**
> "i see boxes assigned to a slot but when openning the slot in struture page it says available"

### Current Code
```tsx
// structure/page.tsx:801
<Badge variant="success">Available</Badge>
```

This is **hardcoded** and doesn't check if a box is actually assigned to the slot.

### Solution

#### 1. Backend - Add Box Count to Slot Response
```typescript
// location.service.ts - getSlots()
return this.prisma.slot.findMany({
  include: {
    boxes: { select: { id: true, label: true, status: true } },
    // ... other includes
  }
});
```

#### 2. Frontend - Compute Slot Status
```tsx
// Compute slot occupancy
const slotOccupancy = useMemo(() => {
  const map = new Map<string, { occupied: boolean; boxLabel?: string }>();
  allSlots.forEach(slot => {
    // Assuming backend includes boxes array
    const hasBox = slot.boxes && slot.boxes.length > 0;
    map.set(slot.id, {
      occupied: hasBox,
      boxLabel: hasBox ? slot.boxes[0].label : undefined
    });
  });
  return map;
}, [allSlots]);

// In slot details panel
const occupancy = slotOccupancy.get(selectedSlot.id);
<Badge variant={occupancy?.occupied ? "warning" : "success"}>
  {occupancy?.occupied ? `Occupied (${occupancy.boxLabel})` : "Available"}
</Badge>
```

#### 3. Important Note: Schema Says One Slot Can Have Multiple Boxes
The schema has `Slot → MovableBox[]` (one-to-many), but logically:
- User expects: **1 slot = 1 box max** (physical constraint)
- Current schema allows: **1 slot = N boxes**

**Need clarification:** Should schema enforce `Box.slotId` as unique constraint?

---

## Issue 5: Bulk Assign Boxes to Slots

### User Request
> "assign box to a slot bulk action"

### Current State
- Individual box assignment exists via "Assign Box to Slot" in structure page
- Individual box move exists via "Move Box" in boxes page
- No bulk operation

### Proposed Solution: Two Approaches

#### Approach A: Bulk Assign Multiple Boxes to Multiple Slots (1:1 Mapping)
Select N boxes and N slots, assign them in order.

**UI Flow:**
1. Navigate to Structure page
2. Click "Bulk Assign Boxes" button in PageHeader
3. Modal opens with two multi-select lists:
   - Left: Available boxes (status=INACTIVE, not assigned to any slot)
   - Right: Available slots (no boxes assigned)
4. Show count: "Assigning 10 boxes to 10 slots"
5. Click "Assign" - sequential assignment (Box 1 → Slot 1, Box 2 → Slot 2, etc.)

**Pros:**
- Clear 1:1 mapping
- Useful for initial setup (assign 100 boxes to 100 empty slots)

**Cons:**
- Must select both boxes AND slots manually
- Order matters (could be confusing)

#### Approach B: Auto-Assign Unassigned Boxes to Available Slots
Select N boxes, automatically assign to first N available slots.

**UI Flow:**
1. Navigate to Boxes page
2. Multi-select checkboxes on INACTIVE boxes
3. Bulk action dropdown: "Assign to Available Slots"
4. Confirmation modal: "Assign 10 selected boxes to next 10 available slots?"
5. Shows preview: Box MB-0001 → Room A / Shelf 01 / Row A / Slot 1
6. Click "Assign" - backend finds available slots and assigns

**Pros:**
- Simpler UX (only select boxes)
- Backend handles slot finding logic
- Faster for large operations

**Cons:**
- Less control over which box goes to which slot
- Need backend endpoint for auto-assignment

### Recommended: **Approach B (Auto-Assign)**

More practical for government facility setup where:
- 100+ boxes need to be placed quickly
- Physical slot location doesn't matter much (all in same room)
- Staff scans boxes as they place them (verification happens later)

### Implementation: Approach B

#### 1. Backend Endpoint
```typescript
// POST /location/bulk-assign-boxes
// Body: { boxIds: string[], roomId?: string }
async bulkAssignBoxesToSlots(boxIds: string[], roomId?: string, userId: string) {
  // 1. Fetch boxes (validate all are INACTIVE)
  // 2. Find available slots (no boxes assigned, optionally filtered by roomId)
  // 3. Validate: slots.length >= boxes.length
  // 4. Transaction: assign each box to a slot, create movement logs
  // 5. Return: { success: true, assignments: [ {boxId, slotId, location}] }
}
```

#### 2. Frontend - Boxes Page
```tsx
// Add multi-select checkboxes
const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);

// Add bulk action button
{selectedBoxIds.length > 0 && (
  <Button onClick={() => setModalType('bulk-assign-to-slots')}>
    Assign {selectedBoxIds.length} Boxes to Slots
  </Button>
)}

// Add modal with room filter and preview
```

---

## Issue 6: Update API Contract

### Current Issues
The API_CONTRACT.md is mostly accurate but missing:

1. **Box Status Logic** - Document when INACTIVE is set
2. **Slot Capacity** - Clarify if one slot can hold multiple boxes
3. **Bulk Endpoints** - Missing from contract:
   - `POST /location/bulk-assign-boxes` (to be implemented)
   - Document that bulk slot/row creation is client-side
4. **Delete Endpoints** - Clarify hard vs soft delete behavior
5. **Slot Response** - Should include box count/occupancy status
6. **Dashboard Stats** - Endpoint exists but may not match schema

### Required Updates

#### 1. Add to Entities Section
```typescript
### MovableBox (Updated)
{
  // ... existing fields
  status: "ACTIVE" | "FULL" | "INACTIVE"
  // INACTIVE: Box not assigned to any slot (slotId === null)
  // FULL: Box at capacity (occupiedCount >= capacity)
  // ACTIVE: Box has space and is assigned to slot
}

### Slot (Updated)
{
  // ... existing fields
  boxes?: MovableBox[]  // Optional: included in some responses
  occupiedCount?: number  // Computed: number of boxes in this slot
}
```

#### 2. Add to Endpoints Section
```typescript
| POST   | /location/bulk-assign-boxes | `{ boxIds[], roomId? }` | `{ success, assignments[] }` | ADMIN      |
```

#### 3. Update Delete Documentation
```markdown
## Delete Behavior
- **Hard Delete**: Rooms, Shelves, Rows, Slots (permanent removal)
- **Soft Delete** (if implemented): Passports, Boxes (marked deleted, can be restored)
- **Safety Checks**: All deletes validate no dependent records exist
```

---

## Implementation Priority

### Phase 1: Critical UX Fixes (Do First)
1. ✅ **Replace window.confirm() with ConfirmModal** - Affects all destructive actions
2. ✅ **Fix slot "Available" status** - Shows wrong information to users
3. ✅ **Implement box INACTIVE status** - Core business logic issue

### Phase 2: Feature Additions (Do Next)
4. ⚠️ **Bulk assign boxes to slots** - High-value productivity feature
5. ⚠️ **Update API contract** - Documentation debt

### Phase 3: Advanced (Consider Based on Needs)
6. ❓ **Soft delete for passports/boxes** - Depends on user requirements
   - **Question for user**: Do you need the ability to recover deleted boxes/passports?
   - **Question for user**: Are audit trails from MovementLog sufficient, or do you need to see "who deleted what"?

---

## Decision Required from User

### Question 1: Soft Delete
Do you want soft delete (archive/restore) functionality for:
- [ ] Passports (can recover accidentally deleted documents)
- [ ] Boxes (can mark temporarily out-of-service)
- [ ] None (current hard delete is fine, MovementLog provides audit trail)

### Question 2: Slot-to-Box Relationship
Physical constraint clarification:
- [ ] One slot can hold ONLY ONE box at a time (add unique constraint on `Box.slotId`)
- [ ] One slot can hold MULTIPLE boxes (keep current schema, boxes can stack)

### Question 3: Bulk Assign Implementation
Preferred bulk assign approach:
- [ ] Approach A: Manual mapping (select boxes AND slots, map them 1:1)
- [ ] Approach B: Auto-assign (select boxes, auto-find available slots)
- [ ] Both (add both options)

---

## Estimated Effort

| Task | Effort | Files Changed |
|------|--------|---------------|
| ConfirmModal component | 2h | 6 files |
| Fix slot status display | 1h | 2 files |
| Box INACTIVE logic | 3h | 4 files + migration |
| Bulk assign boxes (Approach B) | 4h | 3 files |
| Update API contract | 1h | 1 file |
| **Total (Phase 1 + 2)** | **11h** | **16 files** |
| Soft delete (optional) | 6h | 8 files + migration |

---

## Next Steps

**User should review and answer:**
1. Confirm Phase 1 & 2 should proceed
2. Answer Decision Questions (1-3)
3. Approve implementation order

**Then I will implement in this order:**
1. Create ConfirmModal component
2. Replace all window.confirm() calls
3. Fix slot status display
4. Implement box INACTIVE logic
5. Implement bulk assign boxes to slots
6. Update API contract
7. (Optional) Implement soft delete if requested
