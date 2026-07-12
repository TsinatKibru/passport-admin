# Bulk Actions Design for Structure Page

## Professional Use Cases Analysis

### What Makes Sense for Physical Storage Management?

When setting up or managing a physical facility like a passport storage warehouse, certain operations need to happen in bulk for efficiency.

---

## ✅ Recommended Bulk Actions

### 1. **Bulk Create Slots** (MOST USEFUL)

**Scenario**: Administrator sets up a new row and needs to create 20 slots at once
- Row A needs: Slot 1, Slot 2, Slot 3... Slot 20

**Current Pain**: Click "Add Slot" 20 times, fill form 20 times
**With Bulk**: One form to create slots 1-20 in one operation

**Form Fields**:
- Parent Row (selected)
- Slot name pattern: `Slot {n}` or custom pattern
- QR code pattern: `{roomCode}-{shelfCode}-{rowCode}-{n}`
- Start number: 1
- End number: 20
- Starting position: 1

**Business Value**: ⭐⭐⭐⭐⭐ (Highest)
- Saves massive time during facility setup
- Ensures consistent naming (Slot 1, 2, 3... not Slot 01, Slot 1, Slot_1)
- Generates sequential QR codes automatically

---

### 2. **Bulk Create Rows** (VERY USEFUL)

**Scenario**: New shelf needs Row A, Row B, Row C... Row Z

**Form Fields**:
- Parent Shelf (selected)
- Row name pattern: `Row {letter}` or `Row {n}`
- QR code pattern: `{roomCode}-{shelfCode}-ROW-{letter}`
- Rows: A-Z or 1-10 or custom list

**Business Value**: ⭐⭐⭐⭐
- Common in warehouse setups (standardized row naming)
- Reduces errors in naming conventions

---

### 3. **Bulk Create Shelves** (USEFUL)

**Scenario**: New room needs Shelf 01, Shelf 02... Shelf 20

**Form Fields**:
- Parent Room (selected)
- Shelf name pattern: `Shelf {n:02d}` (zero-padded)
- QR code pattern: `{roomCode}-SHELF-{n:02d}`
- Start number: 1
- End number: 20

**Business Value**: ⭐⭐⭐
- Useful for large facilities
- Less common than slots (fewer shelves per room)

---

### 4. **Bulk Delete (with Safety Checks)** (ESSENTIAL)

**Scenario**: Room layout needs to be reconfigured, delete Row A through Row E

**Safety Requirements**:
- ⚠️ CRITICAL: Cannot delete if contains boxes with passports
- Show warning with occupancy count
- Require confirmation with typed verification
- Delete in correct order (slots → rows → shelves → rooms)

**Form**:
- Select multiple entities (checkboxes)
- Show dependency tree
- Display warnings for non-empty slots
- Confirmation: Type "DELETE" to proceed

**Business Value**: ⭐⭐⭐⭐
- Essential for facility reconfiguration
- Must be safe (cannot lose passport data)

---

### 5. **Bulk Move Boxes Between Rows** (ADVANCED)

**Scenario**: Reorganizing storage, move all boxes from Row A (being decommissioned) to Row B

**Form Fields**:
- Source Row (selected)
- Target Row (dropdown)
- Show list of boxes to be moved
- Validate target has enough empty slots

**Business Value**: ⭐⭐⭐
- Useful for facility maintenance/reorganization
- Complex operation (needs validation)

---

## ❌ What NOT to Include

### 1. **Bulk Create Rooms**
**Why Not**: Rooms are facility-level, rarely created in bulk. Each room is unique (Room A, Room B, Storage, Archive, etc.). Manual creation is appropriate.

### 2. **Bulk Edit Names**
**Why Not**: Physical locations have fixed names. Renaming would invalidate QR codes, printed labels, and cause confusion. Better to delete and recreate.

### 3. **Bulk QR Code Regeneration**
**Why Not**: QR codes are printed on physical labels. Changing them requires reprinting and relabeling. Not a software-only operation.

---

## 🎯 Recommended Implementation Priority

### Phase 1: Essential Setup Operations
1. **Bulk Create Slots** (P0 - Highest ROI)
2. **Bulk Create Rows** (P1 - Common need)

### Phase 2: Advanced Management
3. **Bulk Delete with Safety** (P1 - Essential for reconfig)
4. **Bulk Create Shelves** (P2 - Nice-to-have)

### Phase 3: Complex Operations
5. **Bulk Move Boxes** (P3 - Advanced use case)

---

## 🎨 UI/UX Design Principles

### Selection Pattern
```
Instead of checkboxes on tree (too complex), use:
- Right-click context menu
- "Bulk Actions" button in header
- Opens modal with operation selection
```

### Bulk Create Modal Flow
```
Step 1: Select Operation
[●] Bulk Create Slots
[ ] Bulk Create Rows
[ ] Bulk Create Shelves

Step 2: Select Parent
Room: Room A > Shelf: Shelf 01 > Row: Row A

Step 3: Configure Pattern
Name Pattern: Slot {n}
QR Pattern: QR-A-01-A-{n}
Start: 1  End: 20  Position Start: 1

Step 4: Preview (shows 3 examples)
✓ Slot 1 | QR-A-01-A-1 | Position 1
✓ Slot 2 | QR-A-01-A-2 | Position 2
...
✓ Slot 20 | QR-A-01-A-20 | Position 20

[Cancel] [Create 20 Slots]
```

### Bulk Delete Modal Flow
```
Step 1: Select Items
[✓] Slot 1 (Empty)
[✓] Slot 2 (Contains Box MB-001 with 5 passports) ⚠️
[ ] Slot 3 (Empty)

Warning: 1 slot contains boxes with passports.
Move or clear these boxes before deletion.

Step 2: Confirmation
Type DELETE to confirm: [_______]

[Cancel] [Delete 1 Empty Slot]
```

---

## 🔧 Technical Implementation

### Backend API Endpoints Needed

```typescript
// Bulk create slots
POST /api/location/slots/bulk
{
  rowId: string,
  pattern: {
    nameTemplate: "Slot {n}",
    qrTemplate: "{roomCode}-{shelfCode}-{rowCode}-{n}",
    start: 1,
    end: 20,
    positionStart: 1
  }
}
Response: { created: Slot[], errors?: any[] }

// Bulk create rows
POST /api/location/rows/bulk
{
  shelfId: string,
  pattern: {
    nameTemplate: "Row {letter}",
    qrTemplate: "{roomCode}-{shelfCode}-ROW-{letter}",
    sequence: "A-Z" // or "1-10"
  }
}

// Bulk delete (with validation)
POST /api/location/slots/bulk-delete
{
  slotIds: string[],
  force: false // if true, bypass safety checks (admin override)
}
Response: { 
  deleted: number, 
  skipped: { id: string, reason: string }[],
  errors?: any[]
}

// Validation endpoint (pre-check before delete)
POST /api/location/validate-delete
{
  entityType: "slot" | "row" | "shelf" | "room",
  ids: string[]
}
Response: {
  safe: string[],
  unsafe: Array<{
    id: string,
    reason: string,
    occupancy: { boxes: number, passports: number }
  }>
}
```

---

## 🎭 Example User Flows

### Flow 1: Setting Up New Row with 20 Slots

**Before Bulk Actions**:
1. Admin creates Row A
2. Admin clicks "Add Slot" → fills form → creates "Slot 1"
3. Admin clicks "Add Slot" → fills form → creates "Slot 2"
4. ... (repeats 18 more times)
5. **Total time**: 20 minutes, high error rate

**After Bulk Actions**:
1. Admin creates Row A
2. Admin clicks "Bulk Actions" → "Bulk Create Slots"
3. Fills: Name: "Slot {n}", QR: "QR-A-01-A-{n}", Range: 1-20
4. Previews, clicks "Create 20 Slots"
5. **Total time**: 2 minutes, zero errors ✅

---

### Flow 2: Decommissioning Old Storage Row

**Before Bulk Actions**:
1. Admin manually checks each slot for occupancy
2. Admin clicks delete on Slot 1, confirms
3. Admin clicks delete on Slot 2, gets error (has boxes)
4. Admin confused, doesn't know which slots have boxes
5. Gives up or deletes wrong slots

**After Bulk Actions**:
1. Admin selects Slot 1-10
2. Clicks "Bulk Delete"
3. System shows: "7 empty, 3 contain boxes (15 passports total)"
4. Admin sees which specific slots are occupied
5. Admin deselects occupied slots
6. Confirms deletion of 7 empty slots
7. System deletes safely ✅

---

## 📊 Expected Impact

### Time Savings
- **Bulk Create Slots**: 90% time reduction (20 min → 2 min for 20 slots)
- **Bulk Create Rows**: 85% time reduction (15 min → 2 min for 10 rows)
- **Bulk Delete**: 70% time reduction + safety improvements

### Error Reduction
- **Naming Consistency**: 100% (automated patterns)
- **QR Code Conflicts**: Eliminated (validated before creation)
- **Accidental Data Loss**: Prevented (safety checks)

### User Satisfaction
- Initial facility setup: 5-10x faster
- Facility reconfiguration: Safer and faster
- Professional, enterprise-grade feel

---

## 🚨 Safety Requirements

### MUST HAVE for Bulk Delete:
1. ✅ Check all child entities (slots → rows → shelves → rooms)
2. ✅ Prevent deletion if contains boxes with passports
3. ✅ Show clear warnings with occupancy counts
4. ✅ Require typed confirmation ("DELETE")
5. ✅ Transaction-based (all or nothing)
6. ✅ Audit log all bulk operations
7. ✅ Admin-only (STAFF cannot bulk delete)

### MUST HAVE for Bulk Create:
1. ✅ Validate all QR codes are unique BEFORE creation
2. ✅ Validate all names are unique within parent
3. ✅ Transaction-based (rollback if any fails)
4. ✅ Preview before execution (show first 3 + last 1)
5. ✅ Limit maximum: 100 items per bulk operation
6. ✅ Show progress indicator for large operations

---

## 🎯 Recommendation

**Implement Phase 1 first** (Bulk Create Slots + Rows):
- Highest business value
- Lower risk (create operations)
- Immediate time savings
- Professional setup experience

**Phase 2** (Bulk Delete) requires more careful implementation:
- Higher risk (data safety)
- Complex validation logic
- Essential for long-term facility management

**Skip Phase 3** for now (Bulk Move):
- Advanced use case
- Can be done manually with current tools
- Add later based on user feedback

---

## Next Steps

1. Design modal UI for bulk create slots
2. Implement backend bulk create endpoint with validation
3. Add preview step to show what will be created
4. Test with 50+ slots to verify performance
5. Add audit logging for all bulk operations
6. Document in user guide with screenshots
