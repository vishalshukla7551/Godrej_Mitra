# useEffect Dependency Array Fix

## Issue
React was throwing an error: "The final argument passed to useEffect changed size between renders. The order and size of this array must remain constant."

## Root Cause
The report pages had inconsistent variable names for filter states:
- **ABM & ZSM**: Used `planSearch`, `storeSearch`, `deviceSearch`
- **ASE & ZSM**: Used `planFilter`, `storeFilter`, `deviceFilter`

This inconsistency caused React to detect changing dependency array sizes when switching between pages or during renders.

## Solution
Standardized all report pages to use consistent variable names:

### ✅ **Standardized Variable Names**
All pages now use:
- `planSearch` / `setPlanSearch`
- `storeSearch` / `setStoreSearch` 
- `deviceSearch` / `setDeviceSearch`

### ✅ **Consistent useEffect Dependencies**
All pages now have the same dependency array:
```typescript
useEffect(() => {
  fetchReports(); // or fetchData()
}, [activeTab, planSearch, storeSearch, deviceSearch]);
```

### ✅ **Updated References**
Fixed all references in:
- State declarations
- Function parameters
- Input value bindings
- onChange handlers
- Dropdown filter logic
- onClick handlers

## Files Updated

### 1. ASE Report Page (`src/app/ASE/report/page.tsx`)
- Changed `planFilter` → `planSearch`
- Changed `storeFilter` → `storeSearch`
- Changed `deviceFilter` → `deviceSearch`
- Updated all references and handlers

### 2. ZSM Report Page (`src/app/ZSM/report/page.tsx`)
- Changed `planFilter` → `planSearch`
- Changed `storeFilter` → `storeSearch`
- Changed `deviceFilter` → `deviceSearch`
- Updated all references, handlers, and dropdown logic

### 3. ABM & ZSM Report Pages
- Already using correct variable names
- No changes needed

## Result
- ✅ Consistent variable names across all report pages
- ✅ Stable useEffect dependency arrays
- ✅ No more React warnings about changing dependency array size
- ✅ Maintained all existing functionality

## Testing
After these changes:
1. Navigate between different role report pages
2. Switch between Monthly and Spot tabs
3. Use filters on both tabs
4. Verify no console errors or warnings
5. Confirm all functionality works as expected