# Bulk Register Boxes - Troubleshooting Guide

## Issue: "Registered 0 boxes, 7 failed (likely duplicates)"

### What This Means
All boxes failed to create because they already exist in the database.

### Why This Happens
When you bulk register boxes, each box needs:
1. **Unique Label** (e.g., MB-0004, MB-0005)
2. **Unique QR Code** (e.g., BOX-0004, BOX-0005)

If ANY of these already exist in the database, the box creation fails.

---

## Diagnosis Steps

### Step 1: Check What Boxes Already Exist
Look at your current boxes page. You have:
- MB-0001 (BOX-MB-0001)
- MB-0002 (BOX-MB-0002)

### Step 2: Check Your Bulk Register Form
You're trying to create boxes 4-10 (7 boxes):
- **Start Number**: 4
- **End Number**: 10
- **Label Pattern**: `MB-{n:04d}`
- **QR Pattern**: `BOX-{n:04d}`

This will create:
- MB-0004 / BOX-0004
- MB-0005 / BOX-0005
- MB-0006 / BOX-0006
- MB-0007 / BOX-0007
- MB-0008 / BOX-0008
- MB-0009 / BOX-0009
- MB-0010 / BOX-0010

### Step 3: Why They Failed
**Most Likely Reasons:**

1. **You already tried this before** - Boxes 4-10 already exist in database
2. **Previous test data** - You created these boxes earlier and forgot
3. **QR codes conflict** - The QR codes BOX-0004, etc. already exist

---

## Solutions

### Solution 1: Start from a Different Number
Instead of 4-10, try:
- **Start Number**: 11 (or higher)
- **End Number**: 20

This will create MB-0011 through MB-0020.

### Solution 2: Use a Different Pattern
Change your patterns to avoid conflicts:
- **Label Pattern**: `NEWBOX-{n:04d}`
- **QR Pattern**: `NB-{n:04d}`

This creates completely different boxes.

### Solution 3: Delete Existing Boxes First
If you want to recreate boxes 4-10:
1. Go to Boxes page
2. Delete MB-0004 through MB-0010 (if they exist)
3. Try bulk register again

**Note:** You can only delete empty boxes (0 passports).

### Solution 4: Check the Database Directly
Connect to your database and check:
```sql
SELECT label, qr_code FROM movable_boxes ORDER BY label;
```

This shows ALL boxes and their QR codes.

---

## How to See Detailed Error Messages

### In Browser Console
1. Open bulk register modal
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try to register boxes
5. Look for error messages like:
   - `"Box with QR code BOX-0004 already exists"`
   - `"Box with label MB-0004 already exists"`

### In Error Toast
After the latest update, the error toast will show:
- Which specific error caused the failure
- Example: "All 7 boxes failed. Error: Box with QR code BOX-0004 already exists"

---

## Prevention Tips

### 1. Always Check Existing Boxes First
Before bulk registering:
1. Go to Boxes page
2. Check what boxes exist
3. Choose start number AFTER the last box

### 2. Use Sequential Numbering
If your last box is MB-0003:
- Start your next bulk register at number 4
- If last box is MB-0020, start at 21

### 3. Use the Preview
The bulk register modal shows a preview of first 3 boxes:
- Check if these look like boxes you already have
- If they look familiar, change the start number

---

## Example: Correct Bulk Register

**Current Boxes:**
- MB-0001
- MB-0002

**What to Do:**
```
Start Number: 3
End Number: 10
Label Pattern: MB-{n:04d}
QR Pattern: BOX-{n:04d}
```

**This Creates:**
- MB-0003 / BOX-0003 ✅
- MB-0004 / BOX-0004 ✅
- MB-0005 / BOX-0005 ✅
- ... through MB-0010 ✅

---

## Still Having Issues?

### Check for Hidden Boxes
Your database might have boxes you deleted from the UI but still exist in the database.

Run this SQL to see ALL boxes:
```sql
SELECT id, label, qr_code, status, slot_id, created_at 
FROM movable_boxes 
ORDER BY created_at DESC;
```

### Check Backend Logs
Look at your backend console for detailed error messages:
```bash
cd passport-track-api
npm run start:dev
```

Watch for errors when you try bulk register.

---

## Summary

**The "7 failed" message means:**
- The boxes you're trying to create already exist
- Either the labels (MB-0004) OR QR codes (BOX-0004) are duplicates

**Quick Fix:**
- Change Start Number to 11 (or higher)
- Or use a different pattern like `NEWBOX-{n:04d}`

**Best Practice:**
- Always start numbering AFTER your last existing box
- Check the preview before clicking "Register"
