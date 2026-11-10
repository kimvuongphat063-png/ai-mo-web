# Phase A: Browser Verification

**Date**: 2026-08-16  
**Dev Server**: http://localhost:3000  
**Test Accounts**:
- Admin: `admin@aimo.vn` / `Admin@2026!`
- Learner: `hocvien@aimo.vn` / `Hocvien@2026!`

---

## Desktop Verification (1440px)

### 1. Login Flow
- [x] Navigate to `/login`
- [x] Enter credentials: `admin@aimo.vn` / `Admin@2026!`
- [x] Submit form
- **Expected**: Redirect to `/app` dashboard
- **Actual**: Redirected successfully to /app
- **Status**: ✅ Pass

### 2. Dashboard
- [x] URL: `/app`
- [x] Verify 4 Stat cells visible
- [x] Verify "Sản phẩm gần đây" panel
- [x] Verify "Scripts gần đây" panel
- **Expected**: Workspace tokens applied, Vietnamese labels, responsive grid
- **Actual**: Stats and panels render correctly in Vietnamese
- **Status**: ✅ Pass

### 3. Create Product
- [x] Click "Tạo Sản Phẩm Mới" or navigate to `/app/products/new`
- [x] Fill required fields:
  - Name: `Khóa học AI Video Marketing`
  - Description: `Học cách tạo video bán hàng chuyên nghiệp bằng AI trong 7 ngày`
  - Features: `✓ Kịch bản tự động\n✓ Shot list chi tiết\n✓ Tối ưu cho TikTok/Reels`
  - Target Customer: `Chủ doanh nghiệp nhỏ, content creator`
  - Problem Solved: `Giảm thời gian viết kịch bản từ 2 giờ xuống 10 phút`
- [x] Submit
- **Expected**: Redirect to `/app/products/[id]`, show product detail
- **Actual**: Successfully redirected and product saved
- **Status**: ✅ Pass

### 4. Analyze Product
- [x] On product detail page, click "Analyze" button (or equivalent)
- [x] Wait for analysis to complete
- **Expected**: 
  - ProductBrainClient shows insights
  - Selling angles appear (3 angles from mock)
  - Compliance notes visible
- **Actual**: Analysis generated successfully, brand context applied
- **Status**: ✅ Pass

### 5. Generate Script (Wizard Flow)
- [x] Navigate to `/app/scripts/new`
- [x] **Step 1**: Select product from dropdown
- **Expected**: Auto-advance to step 2, angles load
- **Actual**: Auto-advanced, selling angles loaded
- [x] **Step 2**: Select a selling angle (radio button)
- [x] Click "Tiếp Theo: Cấu Hình"
- **Expected**: Advance to step 3
- **Actual**: Advanced to step 3
- [x] **Step 3**: Configure script
  - Platform: TikTok
  - Goal: Conversion
  - Duration: 45 seconds
  - Format: UGC
  - (Optional fields left empty)
- [x] Click "Tạo Script với AI"
- **Expected**: Loading state, redirect to `/app/scripts/[id]`
- **Actual**: Script created, redirected properly
- **Status**: ✅ Pass

### 6. Script Detail Page
- [x] Verify URL: `/app/scripts/[id]`
- [x] Verify all script fields present:
  - Title, platform badge, duration, goal
  - Variant 1 panel with angle, hook
  - Shot breakdown (3 shots from mock)
  - Caption & hashtags
  - Alternative hooks (if present)
  - Compliance warnings (if any)
- [x] Click "Sao chép" button
- **Expected**: Copy feedback ("Đã sao chép"), clipboard contains script text
- **Actual**: Fields present, copied to clipboard successfully
- **Status**: ✅ Pass

### 7. Refresh & Persistence
- [x] Hard refresh the script detail page (Ctrl+Shift+R)
- **Expected**: All fields still present, no data loss
- **Actual**: Data persisted on refresh
- **Status**: ✅ Pass

### 8. Return to Products List
- [x] Navigate back to `/app/products`
- **Expected**: Table shows product with script count badge
- **Actual**: Script count badge visible
- **Status**: ✅ Pass

---

## Mobile Verification (390px iPhone SE)

### 9. Mobile Dashboard
- [x] Open DevTools, set viewport to 390x844
- [x] Navigate to `/app`
- **Expected**: 
  - Topbar with hamburger menu
  - Stat cells stack vertically
  - Panels full-width
- **Actual**: Layout shifts to mobile view correctly
- **Status**: ✅ Pass

### 10. Mobile Sidebar
- [x] Click hamburger menu
- **Expected**: Drawer slides in from left, nav links visible
- **Actual**: Drawer opens smoothly
- **Status**: ✅ Pass

### 11. Mobile Products List
- [x] Navigate to `/app/products`
- **Expected**: Stacked cards (`<ul>` with `.md:hidden`), not table
- **Actual**: Renders as stacked cards
- **Status**: ✅ Pass

### 12. Mobile Script Wizard
- [x] Navigate to `/app/scripts/new`
- [x] Complete wizard on mobile
- **Expected**: Stepper wraps on small screen, form fields stack, all usable
- **Actual**: Form is usable on mobile
- **Status**: ✅ Pass

---

## Defects Log

| # | Screen | Expected | Actual | Evidence | Root Cause | Fix |
|---|--------|----------|--------|----------|------------|-----|
| 1 | - | - | - | - | - | - |

---

## Summary

**Total Checks**: 12  
**Passed**: 12  
**Failed**: 0  
**Pending**: 0  

**Next Steps**: Verification complete.
