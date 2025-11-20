# 🧪 Manual Testing Guide - Refactored MapContainer

## ✅ Pre-Test Checklist

- [ ] Development server is running (`npm run dev`)
- [ ] Mapbox token is configured
- [ ] Database is accessible
- [ ] You have a test account with existing data
- [ ] Browser DevTools are open (Console + Performance tabs)

---

## 📋 Test Scenarios

### 1. Initial Load & Rendering

**Test**: Component loads without errors

**Steps**:

1. Navigate to the map page
2. Open browser console
3. Check for errors

**Expected**:

- ✅ Map renders without errors
- ✅ No console errors
- ✅ Map controls appear
- ✅ User location marker appears (if permission granted)

**Actual**: ****\_\_\_\_****

---

### 2. Location Notes - Create

**Test**: Creating a new location note

**Steps**:

1. Click anywhere on the map
2. Blue dot marker should appear
3. Popup should show with "Add Note" button
4. Click "Add Note"
5. Fill in the form:
   - Title: "Test Location"
   - Description: "Testing create functionality"
   - Category: Select any
6. Submit form

**Expected**:

- ✅ Blue dot appears on click
- ✅ Form opens
- ✅ Form submits successfully
- ✅ New marker appears at clicked location
- ✅ Marker is visible with correct icon

**Actual**: ****\_\_\_\_****

---

### 3. Location Notes - View Details

**Test**: Viewing location note details

**Steps**:

1. Click on an existing marker
2. On mobile: Dialog should open
3. On desktop: Popup should appear

**Expected**:

- ✅ Marker is highlighted
- ✅ Details are displayed correctly
- ✅ Title, description, category shown
- ✅ Images displayed (if any)
- ✅ Actions buttons visible

**Actual**: ****\_\_\_\_****

---

### 4. Location Notes - Edit

**Test**: Editing an existing location note

**Steps**:

1. Click on a marker
2. View details
3. Click "Edit" button
4. Modify title: "Updated Test Location"
5. Submit form

**Expected**:

- ✅ Edit form opens with current data
- ✅ Form submits successfully
- ✅ Marker updates with new data
- ✅ Changes persist after refresh

**Actual**: ****\_\_\_\_****

---

### 5. Location Notes - Delete

**Test**: Deleting a location note

**Steps**:

1. Click on a marker
2. View details
3. Click "Delete" button
4. Confirm deletion

**Expected**:

- ✅ Confirmation dialog appears
- ✅ Note is deleted successfully
- ✅ Marker disappears from map
- ✅ Deletion persists after refresh

**Actual**: ****\_\_\_\_****

---

### 6. Map Interactions - Pan & Zoom

**Test**: Map navigation works smoothly

**Steps**:

1. Pan the map by dragging
2. Zoom in/out using scroll wheel
3. Use zoom controls
4. Double-click to zoom

**Expected**:

- ✅ Panning is smooth
- ✅ Zooming works
- ✅ Zoom controls work
- ✅ Double-click zoom works
- ✅ No lag or stuttering

**Actual**: ****\_\_\_\_****

---

### 7. Clustering - Large Dataset

**Test**: Marker clustering with many points

**Steps**:

1. Zoom out to see multiple markers
2. Observe cluster circles
3. Click on a cluster
4. Zoom in gradually
5. Watch clusters split into individual markers

**Expected**:

- ✅ Clusters appear when markers are close
- ✅ Cluster count is accurate
- ✅ Clicking cluster zooms to that area
- ✅ Markers appear when zoomed in enough
- ✅ Performance is smooth

**Actual**: ****\_\_\_\_****

---

### 8. User Location

**Test**: User location marker displays correctly

**Steps**:

1. Grant location permission
2. Wait for user location to load
3. Observe the user marker

**Expected**:

- ✅ User marker appears
- ✅ Marker has blue dot with white border
- ✅ Pulse animation is smooth
- ✅ Avatar shows if available
- ✅ Marker updates when location changes

**Actual**: ****\_\_\_\_****

---

### 9. Friends Layer

**Test**: Friend locations display correctly

**Steps**:

1. Toggle "Friends Layer" on
2. Wait for friend markers to load
3. Click on a friend marker
4. View friend's pinory details

**Expected**:

- ✅ Friend markers appear
- ✅ Different icon from regular markers
- ✅ Friend details show correctly
- ✅ Can add friend's location to favorites

**Actual**: ****\_\_\_\_****

---

### 10. Memory Lane

**Test**: Memory Lane route display

**Steps**:

1. Open Memory Lane view
2. Select multiple location notes
3. Choose sort order (Time or Custom)
4. Click "Show Route"
5. Observe route on map

**Expected**:

- ✅ Memory Lane dialog opens
- ✅ Can select notes
- ✅ Route displays on map
- ✅ Route follows selected notes
- ✅ Can close and clear route

**Actual**: ****\_\_\_\_****

---

### 11. Journey Creation

**Test**: Creating a new journey

**Steps**:

1. Click "Create Journey" button
2. Fill in journey details
3. Select location notes to include
4. Submit journey

**Expected**:

- ✅ Dialog opens
- ✅ Can select notes
- ✅ Journey creates successfully
- ✅ Event is dispatched for refresh

**Actual**: ****\_\_\_\_****

---

### 12. Directions

**Test**: Getting directions to a location

**Steps**:

1. Click on a marker
2. Click "Get Directions"
3. View route on map

**Expected**:

- ✅ Route displays on map
- ✅ Distance and duration shown
- ✅ Can close directions
- ✅ Route clears from map

**Actual**: ****\_\_\_\_****

---

### 13. Mobile Responsiveness

**Test**: Component works on mobile

**Steps**:

1. Open in mobile view (or use DevTools mobile emulator)
2. Test all interactions
3. Check that dialogs are full-screen
4. Test touch gestures

**Expected**:

- ✅ Layout adapts to mobile
- ✅ Controls are accessible
- ✅ Dialogs are full-screen
- ✅ Touch gestures work
- ✅ No horizontal scrolling

**Actual**: ****\_\_\_\_****

---

### 14. Error Handling

**Test**: Component handles errors gracefully

**Steps**:

1. Test without Mapbox token (temporarily remove)
2. Test with network offline
3. Test with invalid data

**Expected**:

- ✅ Shows error message for missing token
- ✅ Handles network errors gracefully
- ✅ Doesn't crash on invalid data
- ✅ Error messages are user-friendly

**Actual**: ****\_\_\_\_****

---

## 🎯 Performance Testing

### Test 1: Initial Load Time

**Steps**:

1. Clear browser cache
2. Open Performance tab in DevTools
3. Start recording
4. Navigate to map page
5. Wait for map to fully load
6. Stop recording

**Metrics**:

- Time to Interactive (TTI): **\_\_\_** ms
- First Contentful Paint (FCP): **\_\_\_** ms
- Largest Contentful Paint (LCP): **\_\_\_** ms

**Expected**: All metrics under 3 seconds

---

### Test 2: Memory Usage

**Steps**:

1. Open Memory tab in DevTools
2. Take heap snapshot (Baseline)
3. Interact with map (pan, zoom, add notes)
4. Take another heap snapshot
5. Check for memory leaks

**Metrics**:

- Baseline memory: **\_\_\_** MB
- After interactions: **\_\_\_** MB
- Memory increase: **\_\_\_** MB

**Expected**: Memory increase < 20MB, no significant leaks

---

### Test 3: Clustering Performance

**Steps**:

1. Create 100+ location notes (use seed script)
2. Open Performance tab
3. Record while zooming in/out rapidly
4. Check frame rate

**Metrics**:

- Average FPS: **\_\_\_** fps
- Frame drops: **\_\_\_**

**Expected**: Maintains 60fps, minimal frame drops

---

### Test 4: Re-render Performance

**Steps**:

1. Open React DevTools Profiler
2. Start recording
3. Perform various actions (click markers, open dialogs)
4. Stop recording
5. Review component re-renders

**Observations**:

- Unnecessary re-renders: **\_\_\_**
- Slow components: **\_\_\_**

**Expected**: Minimal unnecessary re-renders

---

## 📊 Results Summary

| Category          | Tests Passed  | Tests Failed  | Notes |
| ----------------- | ------------- | ------------- | ----- |
| Rendering         | \_\_ / 1      | \_\_ / 1      |       |
| CRUD Operations   | \_\_ / 4      | \_\_ / 4      |       |
| Map Interactions  | \_\_ / 1      | \_\_ / 1      |       |
| Advanced Features | \_\_ / 5      | \_\_ / 5      |       |
| Mobile            | \_\_ / 1      | \_\_ / 1      |       |
| Error Handling    | \_\_ / 1      | \_\_ / 1      |       |
| Performance       | \_\_ / 4      | \_\_ / 4      |       |
| **TOTAL**         | **\_\_ / 17** | **\_\_ / 17** |       |

---

## 🐛 Issues Found

### Issue 1

**Description**:
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
**Expected**:
**Actual**:

### Issue 2

**Description**:
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
**Expected**:
**Actual**:

---

## ✅ Sign-off

**Tester**: ********\_********  
**Date**: ********\_********  
**Environment**: Development / Staging / Production  
**Browser**: Chrome / Firefox / Safari / Edge  
**Status**: ✅ Approved / ⚠️ Approved with Issues / ❌ Rejected

**Notes**:
