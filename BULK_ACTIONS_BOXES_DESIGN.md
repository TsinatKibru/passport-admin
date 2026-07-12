# Bulk Actions for Boxes - Design Analysis

## Use Case Analysis

### What Makes Sense for Movable Boxes?

Movable boxes are **physical containers** that hold passports. They need unique labels and QR codes printed on them. Let's analyze realistic bulk operations:

---

## ✅ **Recommended: Bulk Register Boxes**

### Scenario
Organization receives shipment of 50 new empty boxes that need to be registered in the system before use.

### Current Pain
- Click "Add Box" 50 times
- Fill form 50 times: QR code, Label, Capacity
- 30-40 minutes of repetitive work
- High chance of typos

### Solution: Bulk Register
**Form Fields**:
- Label Pattern: `MB-{n:04d}` (MB-0001, MB-0002...)
- QR Pattern: `BOX-{n:04d}` (BOX-0001, BOX-0002...)
- Start Number: 1
- End Number: 50
- Capacity: 10 (same for all)
- Initial Slot Assignment: Optional

**Business Value**: ⭐⭐⭐⭐⭐
- Common during facility setup
- New box shipments need batch registration
- Time saving: 40 min → 2 min (95%)

### Example Output
```
✓ MB-0001 | BOX-0001 | Capacity: 10 | Unassigned
✓ MB-0002 | BOX-0002 | Capacity: 10 | Unassigned
✓ MB-0003 | BOX-0003 | Capacity: 10 | Unassigned
...
✓ MB-0050 | BOX-0050 | Capacity: 10 | Unassigned

Result: 50 boxes registered successfully
```

---

## ✅ **Recommended: Bulk Move Boxes to Slots**

### Scenario 1: Distributing New Boxes
50 new boxes need to be distributed to empty slots in a specific row

### Scenario 2: Reorganizing Storage
Moving all boxes from Row A (being decommissioned) to available slots in Row B

### Current Pain
- Click "Move" on each box individually
- Select target slot 50 times
- No way to see which slots are empty
- 20-30 minutes per 50 boxes

### Solution: Bulk Move with Slot Auto-Assignment
**Options**:

**Option A: Auto-assign to Row**
- Select multiple boxes (checkboxes)
- Choose target row
- System auto-assigns to first N empty slots in that row
- Shows preview: Box MB-001 → Row A Slot 1, Box MB-002 → Row A Slot 2...

**Option B: Manual Slot Selection**
- Select multiple boxes
- Choose specific slots (multi-select list)
- Match 1:1 in order

**Business Value**: ⭐⭐⭐⭐
- Useful for facility reorganization
- New box distribution
- Time saving: 30 min → 3 min (90%)

---

## ❌ **NOT Recommended: Bulk Edit Box Capacity**

**Why Not**: 
- Capacity is physical constraint (box size)
- Changing capacity doesn't change physical box
- Each box may have different capacity
- If needed, delete and recreate

---

## ❌ **NOT Recommended: Bulk Delete Boxes**

**Why Not**: 
- Too dangerous (boxes may contain passports)
- Each box needs individual safety check
- Accidental bulk delete = data loss
- Single delete with confirmation is safer

**Alternative**: Add filter to show only empty boxes, then allow multi-select delete with warnings

---

## 🎯 Implementation Priority

### Phase 1: Essential (Implement Now)
1. **Bulk Register Boxes** - P0 Critical
   - Highest ROI
   - Common operation
   - Simple validation

### Phase 2: Advanced (Later)
2. **Bulk Move with Auto-Assignment** - P1 High
   - More complex (needs slot availability check)
   - Very useful for reorganization
   - Requires backend endpoint

---

## 📐 UI Design

### Bulk Register Boxes Modal

```
┌─────────────────────────────────────────┐
│  Bulk Register Boxes                    │
│  Register multiple boxes at once        │
├─────────────────────────────────────────┤
│                                         │
│  Label Pattern                          │
│  [MB-{n:04d}________________]          │
│  Use {n} for sequential numbers         │
│  Use :04d for zero-padding (MB-0001)    │
│                                         │
│  QR Code Pattern                        │
│  [BOX-{n:04d}_______________]          │
│                                         │
│  ┌───────────┬──────────┬─────────┐   │
│  │ Start #   │ End #    │ Capacity│   │
│  │ [1____]   │ [50___]  │ [10___] │   │
│  └───────────┴──────────┴─────────┘   │
│                                         │
│  Preview (first 3 of 50 boxes):         │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ ✓ MB-0001 | BOX-0001 | Cap: 10  ┃  │
│  ┃ ✓ MB-0002 | BOX-0002 | Cap: 10  ┃  │
│  ┃ ✓ MB-0003 | BOX-0003 | Cap: 10  ┃  │
│  ┃ ... and 47 more                  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                         │
│               [Cancel] [Create 50 Boxes]│
└─────────────────────────────────────────┘
```

### Bulk Register Button Location

**Boxes Page Header**:
```
┌─────────────────────────────────────────┐
│  All Movable Boxes              243 boxes│
│  ┌─────────┐ ┌──────────────┐          │
│  │ + Add   │ │ +Bulk Register│          │
│  └─────────┘ └──────────────┘          │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Specification

### Pattern System Enhancement

Support formatting modifiers:

```typescript
// Basic replacement
"MB-{n}" → MB-1, MB-2, MB-3...

// Zero-padding
"MB-{n:04d}" → MB-0001, MB-0002, MB-0003...
"MB-{n:03d}" → MB-001, MB-002, MB-003...

// With prefix/suffix
"BOX-{n:04d}-2024" → BOX-0001-2024, BOX-0002-2024...
```

### Implementation

```typescript
function formatPattern(pattern: string, number: number): string {
  return pattern.replace(/\{n(:(\d+)d)?\}/g, (match, _, width) => {
    if (width) {
      return String(number).padStart(parseInt(width), '0');
    }
    return String(number);
  });
}

// Usage
formatPattern("MB-{n:04d}", 1)  // → "MB-0001"
formatPattern("MB-{n:04d}", 42) // → "MB-0042"
formatPattern("BOX-{n}", 5)     // → "BOX-5"
```

### Backend API

**Option 1: Sequential Creation (Client-Side)**
- Frontend creates boxes one by one
- Same error handling as slots/rows
- No new backend endpoint needed ✅

**Option 2: Bulk Endpoint (Server-Side)**
```typescript
POST /api/boxes/bulk
{
  pattern: {
    labelTemplate: "MB-{n:04d}",
    qrTemplate: "BOX-{n:04d}",
    start: 1,
    end: 50,
    capacity: 10
  }
}
Response: { created: Box[], failed: any[] }
```

**Recommendation**: Start with Option 1 (simpler, reuses existing validation)

---

## 🚨 Validation & Safety

### Must Validate
1. ✅ Label must be unique (globally)
2. ✅ QR code must be unique (globally)
3. ✅ Pattern must contain `{n}` placeholder
4. ✅ End number ≥ start number
5. ✅ Capacity > 0
6. ✅ Limit: max 100 boxes per bulk operation

### Error Handling
- Continue on duplicate errors (like slots)
- Report: "Created 47 boxes, 3 failed (duplicates)"
- Show which specific labels/QR codes failed

---

## 📊 Expected Impact

### Time Savings
| Task | Before | After | Savings |
|------|--------|-------|---------|
| Register 50 boxes | 40 min | 2 min | 95% |
| Register 100 boxes | 80 min | 3 min | 96% |
| Initial warehouse setup (200 boxes) | 160 min | 5 min | 97% |

### Use Cases
1. **New Facility Setup**: Register 100-200 boxes at once
2. **Box Shipment**: New delivery of 50 boxes
3. **Expansion**: Adding storage capacity with new boxes
4. **Standardization**: Re-labeling system with consistent format

---

## 🎓 User Guide

### How to Bulk Register Boxes

1. Go to **Boxes** page
2. Click **"+Bulk Register"** button (next to "+Add Box")
3. Configure patterns:
   - Label: `MB-{n:04d}` (produces MB-0001, MB-0002...)
   - QR: `BOX-{n:04d}`
   - Range: 1 to 50
   - Capacity: 10
4. Preview shows first 3 examples
5. Click **"Create 50 Boxes"**
6. Wait for toast: "50 boxes registered successfully"
7. See all boxes in the table

### Pattern Tips

**Zero-Padding**:
- `{n}` → 1, 2, 3, 4... 10
- `{n:02d}` → 01, 02, 03... 10
- `{n:03d}` → 001, 002, 003... 100
- `{n:04d}` → 0001, 0002, 0003... 1000

**Best Practices**:
- Use zero-padding for sorting: MB-0001 sorts before MB-0100
- Keep labels short: MB-0001 (not MOVABLE-BOX-0001)
- QR codes should be scannable: 15 characters or less
- Start numbering from 1 or 1001 (not 0)

---

## Summary

**Implement**: Bulk Register Boxes
- **Why**: Highest ROI, common operation, simple to implement
- **Time**: 2-3 hours development
- **Value**: 95% time savings for box registration
- **Risk**: Low (same pattern as slots/rows)

**Skip for now**: Bulk Move, Bulk Delete
- **Why**: More complex, less common, higher risk
- **When**: Phase 2 based on user feedback

**Next Steps**:
1. Add bulk register button to boxes page header
2. Create bulk register modal with pattern system
3. Support zero-padding format (`{n:04d}`)
4. Test with 50-100 boxes
5. Document in user guide
