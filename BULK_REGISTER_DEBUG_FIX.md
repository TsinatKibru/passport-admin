# Bulk Register Boxes - Debug Fix

## Issue
User reported that the "Register N Boxes" button was disabled when opening the Bulk Register modal.

## Root Cause Analysis
The disabled condition was checking multiple validation criteria:
```typescript
disabled={
  bulkRegisterBoxesMutation.isPending || 
  !bulkRegisterForm.labelPattern.trim() || 
  !bulkRegisterForm.qrPattern.trim() || 
  bulkRegisterForm.endNumber < bulkRegisterForm.startNumber ||
  bulkRegisterForm.capacity < 1
}
```

The form had correct default values:
- `labelPattern: 'MB-{n:04d}'` ✓
- `qrPattern: 'BOX-{n:04d}'` ✓
- `startNumber: 1` ✓
- `endNumber: 10` ✓
- `capacity: 10` ✓

**Potential Issue**: The number input handlers used `parseInt(e.target.value) || 1` which could fail in edge cases:
- If user types `0`, it would become `1` (because `0 || 1` = `1`)
- If the input was cleared and somehow became `NaN`, the fallback would work
- But the `||` operator is not the cleanest way to handle this

## Changes Made

### 1. Added Debug Logging
Added a `useEffect` hook to log form state changes to the browser console:
```typescript
useEffect(() => {
  console.log('Bulk Register Form State:', bulkRegisterForm);
}, [bulkRegisterForm]);
```

This will help users see the form state in real-time and identify which field is causing the button to be disabled.

### 2. Improved Number Input Handlers
Changed from:
```typescript
onChange={(e) => setBulkRegisterForm({ 
  ...bulkRegisterForm, 
  startNumber: parseInt(e.target.value) || 1 
})}
```

To:
```typescript
onChange={(e) => {
  const val = parseInt(e.target.value);
  setBulkRegisterForm({ 
    ...bulkRegisterForm, 
    startNumber: isNaN(val) ? 1 : Math.max(1, val) 
  });
}}
```

**Benefits**:
- Explicitly checks for `NaN` instead of relying on falsy coercion
- Uses `Math.max(1, val)` to ensure minimum value of 1
- More readable and maintainable
- Applied to all three number inputs: startNumber, endNumber, capacity

### 3. Improved Button Text Calculation
Changed from:
```typescript
`Register ${bulkRegisterForm.endNumber - bulkRegisterForm.startNumber + 1} Boxes`
```

To:
```typescript
`Register ${Math.max(0, bulkRegisterForm.endNumber - bulkRegisterForm.startNumber + 1)} Boxes`
```

This prevents negative box counts from showing in the button text if endNumber < startNumber.

## Testing Instructions

1. Open the Boxes page
2. Click "Bulk Register" button
3. Open browser console (F12)
4. Watch console logs showing form state
5. Try modifying the inputs:
   - Clear a field and re-enter a value
   - Try entering 0 (should become 1)
   - Try entering negative numbers (should become 1)
   - Try setting endNumber < startNumber (button should disable)
6. Verify the button:
   - Should be enabled with default values
   - Should show correct count (e.g., "Register 10 Boxes")
   - Should disable when validation fails

## Next Steps

If the button is still disabled:
1. Check browser console for the form state log
2. Identify which field is causing validation to fail
3. Report back with the console log output

The debug logging will make it immediately clear which validation condition is failing.

## Files Modified
- `passport-track-admin/src/app/boxes/page.tsx`
  - Added useEffect debug logging (lines ~102-104)
  - Improved number input handlers (lines ~854-880)
  - Improved button text calculation (line ~920)

## Build Status
✅ Build passes with zero errors
✅ TypeScript validation passes
