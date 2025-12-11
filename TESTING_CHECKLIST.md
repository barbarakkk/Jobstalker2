# Testing Checklist - Work Authorization & Demographics Implementation

## Overview
This document provides a comprehensive testing checklist for the Work Authorization & Demographics feature implementation.

---

## Task 10.1: Test All Form Fields

### Work Authorization Questions (Step 7)
- [ ] **US Work Authorization**: Click "Yes" - button highlights, state updates
- [ ] **US Work Authorization**: Click "No" - button highlights, state updates
- [ ] **Canada Work Authorization**: Click "Yes" - button highlights, state updates
- [ ] **Canada Work Authorization**: Click "No" - button highlights, state updates
- [ ] **UK Work Authorization**: Click "Yes" - button highlights, state updates
- [ ] **UK Work Authorization**: Click "No" - button highlights, state updates
- [ ] **Sponsorship Required**: Click "Yes" - button highlights, state updates
- [ ] **Sponsorship Required**: Click "No" - button highlights, state updates
- [ ] Verify all work authorization fields are optional (can skip)
- [ ] Verify button states persist when navigating between steps

### Demographic Dropdowns (Step 7)
- [ ] **Ethnicity**: Open dropdown, select each option, verify selection displays
- [ ] **Has Disability**: Select "Yes", "No", "Decline to state" - verify each works
- [ ] **Is Veteran**: Select "Yes", "No", "Decline to state" - verify each works
- [ ] **Is LGBTQ+**: Select "Yes", "No", "Decline to state" - verify each works
- [ ] **Gender**: Select "Male", "Female", "Non-Binary", "Decline to state" - verify each works
- [ ] Verify all demographic fields are optional (can skip/leave empty)
- [ ] Verify dropdowns show placeholder text when empty

### Location & Personal Information (Step 7)
- [ ] **Current Location**: Type in input field, verify text appears
- [ ] **Date of Birth**: Open date picker, select a date, verify date displays
- [ ] **Date of Birth**: Verify date format is correct (YYYY-MM-DD)
- [ ] Verify both fields are optional

### Phone Number Field (Step 1)
- [ ] **Country Code Selector**: Open dropdown, verify all countries listed
- [ ] **Country Code Selector**: Select different country codes, verify selection updates
- [ ] **Phone Input**: Type phone number, verify text appears
- [ ] **Phone Validation**: Verify phone field is required (cannot submit empty)
- [ ] **Phone Format**: Test with different phone number formats

---

## Task 10.2: Test Form Flow

### Step Navigation
- [ ] **Step 1 → Step 2**: Click "Next" button, verify navigation works
- [ ] **Step 2 → Step 3**: Click "Next" button, verify navigation works
- [ ] **Step 3 → Step 4**: Click "Next" button, verify navigation works
- [ ] **Step 4 → Step 5**: Click "Next" button, verify navigation works
- [ ] **Step 5 → Step 6**: Click "Next" button, verify navigation works
- [ ] **Step 6 → Step 7**: Click "Next" button, verify navigation works
- [ ] **Step 7 → Step 6**: Click "Previous" button, verify navigation works
- [ ] **Step 6 → Step 5**: Click "Previous" button, verify navigation works
- [ ] **Step 5 → Step 4**: Click "Previous" button, verify navigation works
- [ ] **Step 4 → Step 3**: Click "Previous" button, verify navigation works
- [ ] **Step 3 → Step 2**: Click "Previous" button, verify navigation works
- [ ] **Step 2 → Step 1**: Click "Previous" button, verify navigation works

### Progress Bar Navigation
- [ ] Click on Step 1 icon in progress bar, verify navigates to Step 1
- [ ] Click on Step 2 icon in progress bar, verify navigates to Step 2
- [ ] Click on Step 3 icon in progress bar, verify navigates to Step 3
- [ ] Click on Step 4 icon in progress bar, verify navigates to Step 4
- [ ] Click on Step 5 icon in progress bar, verify navigates to Step 5
- [ ] Click on Step 6 icon in progress bar, verify navigates to Step 6
- [ ] Click on Step 7 icon in progress bar, verify navigates to Step 7
- [ ] Click on Step 7 name in progress bar, verify navigates to Step 7
- [ ] Verify hover effects on progress bar icons/names

### Form Submission
- [ ] **Complete All Steps**: Fill all required fields, click "Complete Registration"
- [ ] **Verify Submission**: Check network tab for API calls
- [ ] **Verify Success**: Check for success message or navigation
- [ ] **Verify Dialog**: Extension download dialog appears after submission
- [ ] **Partial Data**: Submit with only required fields, verify works
- [ ] **Empty Optional Fields**: Submit with optional fields empty, verify no errors

### Required Field Validation
- [ ] **Step 1**: Try to proceed without first name - verify error/blocked
- [ ] **Step 1**: Try to proceed without last name - verify error/blocked
- [ ] **Step 1**: Try to proceed without email - verify error/blocked
- [ ] **Step 1**: Try to proceed without phone - verify error/blocked
- [ ] **Step 1**: Try to proceed with invalid email - verify error/blocked

---

## Task 10.3: Test Data Persistence

### Full Data Submission
- [ ] Fill ALL fields in all 7 steps (including new demographic fields)
- [ ] Submit form
- [ ] Check browser Network tab - verify all data sent in request
- [ ] Check backend logs - verify data received correctly
- [ ] Check Supabase database - verify all fields saved:
  - [ ] `work_auth_us` (BOOLEAN)
  - [ ] `work_auth_canada` (BOOLEAN)
  - [ ] `work_auth_uk` (BOOLEAN)
  - [ ] `requires_sponsorship` (BOOLEAN)
  - [ ] `ethnicity` (VARCHAR)
  - [ ] `has_disability` (VARCHAR)
  - [ ] `is_veteran` (VARCHAR)
  - [ ] `is_lgbtq` (VARCHAR)
  - [ ] `gender` (VARCHAR)
  - [ ] `current_location` (VARCHAR)
  - [ ] `date_of_birth` (DATE)
  - [ ] `phone_country_code` (VARCHAR)

### Data Reload/Persistence
- [ ] Fill form partially (e.g., complete Steps 1-4)
- [ ] Reload page
- [ ] Verify data persists (if implemented) OR verify form resets correctly
- [ ] Complete form and submit
- [ ] Reload page after submission
- [ ] Verify profile data persists in database

### Partial Data Submission
- [ ] Fill only required fields, leave all optional fields empty
- [ ] Submit form
- [ ] Verify submission succeeds
- [ ] Check database - verify NULL values for optional fields
- [ ] Fill some optional fields, leave others empty
- [ ] Submit form
- [ ] Verify only filled fields saved, others remain NULL

---

## Task 10.4: Test Extension Dialog

### Extension Detection
- [ ] **With Extension Installed**: 
  - [ ] Complete registration form
  - [ ] Verify dialog shows "Extension Installed!" message
  - [ ] Verify "Currently Installed" button appears
  - [ ] Verify CheckCircle icon displays
- [ ] **Without Extension Installed**:
  - [ ] Complete registration form
  - [ ] Verify dialog shows "Download Chrome Extension" message
  - [ ] Verify "Download Extension" button appears
  - [ ] Verify Download icon displays
- [ ] **Loading State**:
  - [ ] Complete registration form
  - [ ] Verify loading spinner appears briefly
  - [ ] Verify "Checking Extension..." message displays

### Dialog Functionality
- [ ] **Close Dialog**: Click close button (X), verify dialog closes
- [ ] **Close Dialog**: Click outside dialog, verify dialog closes
- [ ] **Close Dialog**: Press ESC key, verify dialog closes
- [ ] **After Close**: Verify navigation to `/resume-builder` occurs
- [ ] **Download Button**: Click "Download Extension" button
- [ ] **Download Button**: Verify Chrome Web Store opens in new tab
- [ ] **Download Button**: Verify correct URL opens (when extension ID is set)

### Extension ID Configuration
- [ ] **Note**: Extension ID placeholder needs to be replaced with actual ID
- [ ] **Note**: Chrome Store URL placeholder needs to be replaced with actual URL
- [ ] Verify placeholders are clearly marked in code

---

## Task 10.5: Cross-Browser Testing

### Chrome Browser
- [ ] Test complete registration flow in Chrome
- [ ] Verify all form fields work correctly
- [ ] Verify extension detection works (if extension installed)
- [ ] Verify dialog displays correctly
- [ ] Verify styling and layout correct

### Firefox Browser
- [ ] Test complete registration flow in Firefox
- [ ] Verify all form fields work correctly
- [ ] Verify extension detection gracefully handles non-Chrome browser
- [ ] Verify dialog displays correctly
- [ ] Verify styling and layout correct

### Safari Browser
- [ ] Test complete registration flow in Safari
- [ ] Verify all form fields work correctly
- [ ] Verify extension detection gracefully handles non-Chrome browser
- [ ] Verify dialog displays correctly
- [ ] Verify styling and layout correct

### Edge Browser
- [ ] Test complete registration flow in Edge (optional)
- [ ] Verify all form fields work correctly
- [ ] Verify extension detection works (if extension installed)
- [ ] Verify dialog displays correctly

---

## Task 10.6: Mobile Responsiveness

### Mobile Device Testing
- [ ] **Small Mobile** (320px - 375px):
  - [ ] Verify form displays correctly
  - [ ] Verify all inputs are accessible and tappable
  - [ ] Verify buttons are large enough for touch
  - [ ] Verify progress bar displays correctly
  - [ ] Verify dialog displays correctly on mobile
- [ ] **Large Mobile** (375px - 425px):
  - [ ] Verify form displays correctly
  - [ ] Verify all inputs are accessible
  - [ ] Verify spacing is appropriate
- [ ] **Tablet** (768px - 1024px):
  - [ ] Verify form displays correctly
  - [ ] Verify layout adapts appropriately

### Touch Interactions
- [ ] Verify all buttons respond to touch
- [ ] Verify dropdowns open on tap
- [ ] Verify date picker works on mobile
- [ ] Verify scrolling works smoothly
- [ ] Verify no horizontal scrolling issues

### Mobile-Specific Features
- [ ] Verify phone number input triggers numeric keypad on mobile
- [ ] Verify date picker uses native mobile date picker
- [ ] Verify country code selector is usable on mobile

---

## Additional Testing Notes

### Code Quality Checks
- [x] ✅ No linter errors (verified)
- [ ] Check for console errors in browser console
- [ ] Verify no TypeScript compilation errors
- [ ] Verify all imports are correct
- [ ] Verify error handling is in place

### Performance Testing
- [ ] Test form with large amounts of data
- [ ] Verify form submission doesn't hang
- [ ] Verify extension detection timeout works (2 seconds)
- [ ] Check network request sizes

### Accessibility Testing
- [ ] Verify all form fields have proper labels
- [ ] Verify keyboard navigation works
- [ ] Verify screen reader compatibility (if applicable)
- [ ] Verify color contrast meets WCAG standards
- [ ] Verify focus states are visible

### Edge Cases
- [ ] Test with very long text inputs
- [ ] Test with special characters in inputs
- [ ] Test with emoji in inputs (if applicable)
- [ ] Test form submission during slow network
- [ ] Test form submission with network error
- [ ] Test rapid clicking on buttons
- [ ] Test navigating steps very quickly

---

## Testing Environment Setup

### Prerequisites
- [ ] Supabase database migration applied
- [ ] Backend server running
- [ ] Frontend development server running
- [ ] Chrome extension installed (for extension testing)
- [ ] Chrome extension NOT installed (for download testing)

### Test Data
- [ ] Create test user account
- [ ] Prepare test data for all fields
- [ ] Have access to Supabase dashboard for database verification

---

## Known Issues / Notes

1. **Extension ID**: Currently uses placeholder `YOUR_EXTENSION_ID` - needs to be replaced
2. **Chrome Store URL**: Currently uses placeholder URL - needs to be replaced
3. **Console Logs**: Multiple console.log statements present - consider removing for production
4. **Data Persistence**: Verify if form data should persist on page reload (currently unclear)

---

## Sign-off

- [ ] All tests completed
- [ ] All issues documented
- [ ] Ready for production deployment

**Tester Name**: _________________________

**Date**: _________________________

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________






