# Smart Bulk Assign Boxes to Slots - User Guide

## Overview
The smart bulk assign feature allows you to automatically assign multiple INACTIVE boxes to available slots in one operation. Perfect for initial setup or when you have many unassigned boxes.

---

## How It Works

### Smart Auto-Assignment Algorithm
1. **You select** which boxes to assign (checkboxes on INACTIVE boxes)
2. **System finds** available slots (slots with no boxes assigned)
3. **System assigns** boxes to slots in sequential order (Room A → Shelf 01 → Row A → Slot 1, 2, 3...)
4. **Boxes auto-activate** when assigned to slots (INACTIVE → ACTIVE)
5. **Movement logs** are created for audit trail

### Sequential Slot Selection
Slots are selected in this order:
1. Room name (alphabetically)
2. Shelf position
3. Row position
4. Slot position

**Example:** If you have 10 boxes, they'll be assigned to:
- Room A / Shelf 01 / Row A / Slot 1
- Room A / Shelf 01 / Row A / Slot 2
- Room A / Shelf 01 / Row A / Slot 3
- ... and so on

---

## Step-by-Step Usage

### Step 1: Filter to Show INACTIVE Boxes
1. Go to **Boxes** page
2. Click the **Status filter** dropdown
3. Select **"Inactive"**
4. You'll now see only unassigned boxes (yellow status badge)

**Why?** Checkboxes only appear when filtering by INACTIVE status. This prevents accidentally selecting assigned boxes.

### Step 2: Select Boxes to Assign
You have three options:

**Option A: Select Individual Boxes**
- Click checkboxes next to specific boxes you want to assign
- Great for cherry-picking specific boxes

**Option B: Select All on Page**
- Click the checkbox in the table header
- Selects all INACTIVE boxes on the current page
- Great for assigning 10 boxes at a time

**Option C: Multi-Page Selection**
- Select boxes on page 1
- Go to page 2, select more boxes
- Your selection persists across pages
- Great for assigning 50+ boxes

### Step 3: Initiate Bulk Assign
1. After selecting boxes, the header changes to show:
   - "X boxes selected" subtitle
   - "Assign X Boxes to Slots" button (replaces Add Box button)
2. Click **"Assign X Boxes to Slots"**
3. Bulk assign modal opens

### Step 4: Choose Room Filter (Optional)
The modal shows a room filter dropdown:

**Option A: Leave as "All Rooms"**
- System uses ANY available slots across all rooms
- Boxes assigned to first available slots regardless of room
- Best for: Initial setup when you don't care about room location

**Option B: Select a Specific Room**
- System only uses slots in the selected room
- Boxes assigned to first available slots in that room only
- Best for: Organizing boxes by room (e.g., all archive boxes in Room B)

**Important:** If you select a room and it doesn't have enough slots:
- Error: "Not enough available slots. Need 10 slots, but only 5 available in selected room."
- Solution: Choose different room or select "All Rooms"

### Step 5: Review and Confirm
The modal shows:
- **Number of boxes** being assigned
- **First 10 box labels** (e.g., MB-0001, MB-0002...)
- **Room filter** status

Click **"Assign X Boxes"** to proceed.

### Step 6: Assignment Complete
On success:
- ✅ Toast notification: "10 boxes assigned to slots successfully"
- Boxes page refreshes automatically
- Boxes now show:
  - Status: ACTIVE (green badge)
  - Location: "Room A / Shelf 01 / Row A / Slot 1"
- Selection clears automatically

---

## Features & Benefits

### 1. Multi-Select Interface
- ✅ Checkboxes for easy selection
- ✅ "Select All" checkbox in header
- ✅ Selection persists across pages
- ✅ Clear Selection button to start over

### 2. Smart Filtering
- ✅ Checkboxes only shown for INACTIVE boxes
- ✅ Can't accidentally select assigned boxes
- ✅ Must filter by INACTIVE status to see checkboxes

### 3. Room Filtering
- ✅ Optional room filter for organizing by location
- ✅ "All Rooms" for fastest assignment
- ✅ Specific room for organized placement

### 4. Auto-Activation
- ✅ Boxes automatically become ACTIVE when assigned
- ✅ No manual status management needed
- ✅ Eliminates tedious activation steps

### 5. Sequential Assignment
- ✅ Predictable slot ordering
- ✅ Organized placement (fills slots sequentially)
- ✅ Easy to find boxes later

### 6. Audit Trail
- ✅ Movement logs created for each assignment
- ✅ Shows "BOX_MOVED" action
- ✅ From: null (unassigned)
- ✅ To: Full location path
- ✅ Includes user who performed action

---

## Use Cases

### Use Case 1: Initial Setup
**Scenario:** You just registered 100 new boxes, all INACTIVE.

**Steps:**
1. Filter by INACTIVE
2. Select all boxes on page 1 (10 boxes)
3. Click "Assign 10 Boxes to Slots"
4. Select "All Rooms"
5. Assign
6. Repeat for pages 2-10

**Result:** 100 boxes assigned in 10 operations (1 minute total)

### Use Case 2: Room Organization
**Scenario:** You want all archive boxes (MB-1000 series) in Room B.

**Steps:**
1. Filter by INACTIVE
2. Search for "MB-1" to show MB-1000, MB-1001, etc.
3. Select all matching boxes
4. Click "Assign X Boxes to Slots"
5. Select "Room B" in room filter
6. Assign

**Result:** All archive boxes now in Room B slots

### Use Case 3: Filling Empty Room
**Scenario:** New Room C just built with 50 empty slots.

**Steps:**
1. Filter by INACTIVE
2. Select first 50 boxes (across 5 pages)
3. Click "Assign 50 Boxes to Slots"
4. Select "Room C"
5. Assign

**Result:** Room C filled with 50 boxes

---

## Error Handling

### Error 1: Not Enough Slots
**Message:** "Not enough available slots. Need 10 slots, but only 5 available."

**Cause:** You selected 10 boxes but only 5 slots are available.

**Solutions:**
1. Select fewer boxes (5 instead of 10)
2. Remove room filter (use "All Rooms" to access more slots)
3. Create more slots in the structure page

### Error 2: Box Already Assigned
**Message:** "These boxes are already assigned to slots: MB-0001, MB-0002. Only INACTIVE boxes can be bulk assigned."

**Cause:** You somehow selected boxes that are already assigned.

**Solution:** This shouldn't happen (checkboxes only for INACTIVE), but if it does:
1. Clear selection
2. Ensure you're filtering by INACTIVE status
3. Re-select boxes

### Error 3: No Boxes Selected
**Cause:** You clicked "Assign Boxes" without selecting any.

**Solution:** Select at least one INACTIVE box first.

---

## Tips & Best Practices

### Tip 1: Use "All Rooms" for Speed
For initial setup, don't filter by room. Let the system fill slots in order across all rooms. You can always move boxes later.

### Tip 2: Assign in Batches
Don't try to assign 100 boxes at once. Assign 10-20 at a time for better control and faster completion.

### Tip 3: Use Search Before Selecting
If you want to assign specific boxes:
1. Search for their label pattern (e.g., "MB-1")
2. Then select all matching results
3. Assign them together

### Tip 4: Check Available Slots First
Before bulk assigning:
1. Go to Structure page
2. Count how many empty slots you have
3. Make sure you don't select more boxes than available slots

### Tip 5: Room Filter for Organization
Use room filters when:
- Organizing by document type (archives in Room A, active in Room B)
- Filling a newly created room
- Keeping related boxes together

---

## Technical Details

### Backend Logic
- Finds slots with `boxes: { none: {} }` (Prisma query)
- Orders slots by room → shelf → row → slot position
- Assigns boxes sequentially to slots
- Updates box status to ACTIVE
- Creates movement log for each assignment
- All operations in a single database transaction (atomic)

### Frontend UX
- Checkboxes only visible when `statusFilter === 'INACTIVE'`
- Selection state persists across pagination
- Header dynamically updates to show selection count
- Modal fetches rooms on-demand (only when opened)

### Performance
- Transaction-based (rollback on any failure)
- Sequential assignment ensures predictable ordering
- Can handle 50+ boxes in one operation
- Typically completes in 2-5 seconds

---

## Comparison: Manual vs Bulk Assign

### Manual Method (OLD)
1. Go to Structure page
2. Expand Room A → Shelf 01 → Row A
3. Click on Slot 1
4. Click "Assign Box to Slot"
5. Select MB-0001 from dropdown
6. Confirm
7. **Repeat steps 3-6 for each box** (10 minutes for 10 boxes)

### Bulk Assign Method (NEW)
1. Go to Boxes page
2. Filter by INACTIVE
3. Select 10 boxes (checkboxes)
4. Click "Assign 10 Boxes to Slots"
5. Click "Assign"
6. **Done!** (30 seconds for 10 boxes)

**Time Saved:** 9.5 minutes per 10 boxes
**For 100 boxes:** 95 minutes saved!

---

## FAQ

**Q: Can I undo bulk assignments?**
A: Not in one click, but you can move boxes back individually using the "Move" button on each box.

**Q: What if I want boxes in specific slots, not sequential?**
A: Use manual assignment from the Structure page for precise placement.

**Q: Can I assign ACTIVE or FULL boxes in bulk?**
A: No, only INACTIVE boxes. This prevents disrupting existing assignments.

**Q: Do boxes stay in the same order as I selected them?**
A: Selection order doesn't matter. Boxes are assigned in the order they appear in the table (by creation date).

**Q: Can I bulk assign boxes to specific rows or shelves?**
A: Not directly, but you can use room filter and the system will fill that room's slots in order.

**Q: What if a box has passports in it?**
A: INACTIVE boxes can't have passports (passports require assigned boxes). So this isn't a concern.

---

## Summary

**Smart Bulk Assign** is the fastest way to:
✅ Assign multiple boxes to slots simultaneously
✅ Organize boxes by room automatically
✅ Activate boxes without manual work
✅ Save hours during initial setup

**Key Features:**
- Multi-select checkboxes
- Optional room filtering
- Sequential slot assignment
- Auto-activation
- Audit trail

**Perfect For:**
- Initial system setup (100+ boxes)
- Room organization
- Filling newly created rooms
- Any time you have many unassigned boxes
