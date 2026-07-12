# Bulk Assign Boxes - Quick Start (30 Seconds)

## 5 Simple Steps

### 1️⃣ Filter by INACTIVE
```
Boxes Page → Status Filter → Select "Inactive"
```
✅ Checkboxes appear

### 2️⃣ Select Boxes
```
Click checkboxes next to boxes OR click header checkbox for all
```
✅ Header shows "X boxes selected"

### 3️⃣ Click Bulk Assign
```
Click "Assign X Boxes to Slots" button in header
```
✅ Modal opens

### 4️⃣ Choose Room (Optional)
```
Select specific room OR leave as "All Rooms"
```
✅ Preview shows selected boxes

### 5️⃣ Assign
```
Click "Assign X Boxes" button
```
✅ Done! Boxes now ACTIVE with locations

---

## Visual Flow

```
┌─────────────────────────────────────────────────────┐
│ Boxes Page                                          │
│ ┌─────────────────────────────────────────────┐   │
│ │ Status: [Inactive ▼]                        │   │
│ │ Header: "5 boxes selected"                  │   │
│ │ Action: [Assign 5 Boxes to Slots]          │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Table:                                              │
│ ┌───┬─────────┬────────┬──────────┬────────┐     │
│ │ ☑ │ BOX ID  │ Label  │ Location │ Status │     │
│ ├───┼─────────┼────────┼──────────┼────────┤     │
│ │ ☑ │ BOX-001 │ MB-001 │ Unassign │INACTIVE│     │
│ │ ☑ │ BOX-002 │ MB-002 │ Unassign │INACTIVE│     │
│ │ ☑ │ BOX-003 │ MB-003 │ Unassign │INACTIVE│     │
│ └───┴─────────┴────────┴──────────┴────────┘     │
└─────────────────────────────────────────────────────┘
                        ↓
                  [Click Assign]
                        ↓
┌─────────────────────────────────────────────────────┐
│ Bulk Assign Modal                                   │
│                                                     │
│ Assign 5 selected boxes to available slots         │
│                                                     │
│ Room: [All Rooms ▼]                                │
│                                                     │
│ Selected: MB-001, MB-002, MB-003...                │
│                                                     │
│           [Cancel]  [Assign 5 Boxes]               │
└─────────────────────────────────────────────────────┘
                        ↓
                  [Click Assign]
                        ↓
         ✅ 5 boxes assigned successfully!
                        ↓
┌─────────────────────────────────────────────────────┐
│ Boxes Page (Refreshed)                              │
│                                                     │
│ Table:                                              │
│ ┌─────────┬────────┬─────────────────┬────────┐   │
│ │ BOX ID  │ Label  │ Location        │ Status │   │
│ ├─────────┼────────┼─────────────────┼────────┤   │
│ │ BOX-001 │ MB-001 │ Room A/S01/R.A/1│ ACTIVE │   │
│ │ BOX-002 │ MB-002 │ Room A/S01/R.A/2│ ACTIVE │   │
│ │ BOX-003 │ MB-003 │ Room A/S01/R.A/3│ ACTIVE │   │
│ └─────────┴────────┴─────────────────┴────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Pro Tips

💡 **Tip 1:** Use "Select All" checkbox to assign entire page at once (10 boxes)

💡 **Tip 2:** Leave room filter as "All Rooms" for fastest assignment

💡 **Tip 3:** Selection persists across pages - select 10 on page 1, 10 on page 2, then assign all 20!

💡 **Tip 4:** Check Structure page first to see how many available slots you have

💡 **Tip 5:** Use search + select for specific boxes (search "MB-1" then select all results)

---

## Common Mistakes

❌ **Mistake:** Trying to select boxes without filtering by INACTIVE
✅ **Fix:** Must filter by INACTIVE status first to see checkboxes

❌ **Mistake:** Selecting more boxes than available slots
✅ **Fix:** Check Structure page for slot count, or assign in batches

❌ **Mistake:** Expecting boxes to go to specific slots
✅ **Fix:** System assigns sequentially - use manual assign for precise placement

---

## Time Savings

| Task | Manual | Bulk Assign | Saved |
|------|--------|-------------|-------|
| 10 boxes | 4.5 min | 11 sec | 4 min |
| 50 boxes | 22 min | 55 sec | 21 min |
| 100 boxes | 45 min | 2 min | 43 min |

---

## That's It!
You're ready to bulk assign boxes. Questions? Check `BULK_ASSIGN_BOXES_GUIDE.md` for full details.
