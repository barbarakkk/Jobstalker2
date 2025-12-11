# Work Authorization & Demographics Implementation Tasks

## Overview
Add work authorization questions, demographic information, and location/personal details to the registration form. After form completion, show a Chrome extension download dialog.

---

## Task 1: Database Schema Updates

### Subtask 1.1: Create Migration File
- [x] Create file: `supabase/migrations/20250115_add_demographic_work_auth_fields.sql`
- [x] Add work authorization columns:
  - `work_auth_us BOOLEAN`
  - `work_auth_canada BOOLEAN`
  - `work_auth_uk BOOLEAN`
  - `requires_sponsorship BOOLEAN`
- [x] Add demographic columns:
  - `ethnicity VARCHAR(100)`
  - `has_disability VARCHAR(20)` (values: 'Yes', 'No', 'Decline to state')
  - `is_veteran VARCHAR(20)` (values: 'Yes', 'No', 'Decline to state')
  - `is_lgbtq VARCHAR(20)` (values: 'Yes', 'No', 'Decline to state')
  - `gender VARCHAR(20)` (values: 'Male', 'Female', 'Non-Binary', 'Decline to state')
- [x] Add location/personal info columns:
  - `current_location VARCHAR(255)`
  - `date_of_birth DATE`
  - `phone_country_code VARCHAR(10)`
- [x] Wrap in BEGIN/COMMIT transaction block
- [ ] Test migration on development database

### Subtask 1.2: Update Schema Documentation
- [x] Update `backend/schema.sql` to include new columns in `user_profile` table definition
- [x] Add comments explaining each field's purpose

---

## Task 2: Backend Models Updates

### Subtask 2.1: Update Profile Model
- [x] Open `backend/models.py`
- [x] Add to `Profile` class (around line 47):
  
  work_auth_us: Optional[bool] = None
  work_auth_canada: Optional[bool] = None
  work_auth_uk: Optional[bool] = None
  requires_sponsorship: Optional[bool] = None
  ethnicity: Optional[str] = None
  has_disability: Optional[str] = None
  is_veteran: Optional[str] = None
  is_lgbtq: Optional[str] = None
  gender: Optional[str] = None
  current_location: Optional[str] = None
  date_of_birth: Optional[date] = None
  phone_country_code: Optional[str] = None
  ### Subtask 2.2: Update CreateProfile Model
- [x] Add same fields to `CreateProfile` class (around line 67)
- [x] All fields should be `Optional[...] = None`

### Subtask 2.3: Update UpdateProfile Model
- [x] Add same fields to `UpdateProfile` class (around line 79)
- [x] All fields should be `Optional[...] = None`

### Subtask 2.4: Update ProfileResponse Model
- [x] Add same fields to `ProfileResponse` class (around line 379)
- [x] All fields should be `Optional[...] = None`

### Subtask 2.5: Test Backend Models
- [x] Run linter: `read_lints` on `backend/models.py`
- [x] Verify no syntax errors

---

## Task 3: Frontend Types Updates

### Subtask 3.1: Update Profile Interface
- [x] Open `frontend/src/lib/types.ts`
- [x] Add to `Profile` interface (around line 57):script
  work_auth_us?: boolean;
  work_auth_canada?: boolean;
  work_auth_uk?: boolean;
  requires_sponsorship?: boolean;
  ethnicity?: string;
  has_disability?: 'Yes' | 'No' | 'Decline to state';
  is_veteran?: 'Yes' | 'No' | 'Decline to state';
  is_lgbtq?: 'Yes' | 'No' | 'Decline to state';
  gender?: 'Male' | 'Female' | 'Non-Binary' | 'Decline to state';
  current_location?: string;
  date_of_birth?: string;
  phone_country_code?: string;
  ### Subtask 3.2: Update CreateProfileData Interface
- [x] Add same fields to `CreateProfileData` interface (around line 122)
- [x] Use same type definitions

### Subtask 3.3: Update UpdateProfileData Interface
- [x] Verify `UpdateProfileData` extends `CreateProfileData` (it should automatically include new fields)
- [x] If not, add fields explicitly

### Subtask 3.4: Test Frontend Types
- [x] Run linter: `read_lints` on `frontend/src/lib/types.ts`
- [x] Verify TypeScript compilation works

---

## Task 4: Registration Form - Add New Step

### Subtask 4.1: Update STEPS Array
- [x] Open `frontend/src/components/Auth/RegistrationComplete.tsx`
- [x] Add import: `FileText` from 'lucide-react'
- [x] Add new step to `STEPS` array:
  
  { id: 7, name: 'Work & Demographics', icon: FileText, color: 'blue' },
  ### Subtask 4.2: Add Constants for Options
- [x] Add after `REFERRAL_SOURCES` constant:
  
  const ETHNICITY_OPTIONS = [
    'Black/African American',
    'East Asian',
    'Hispanic/Latinx',
    'Middle Eastern',
    'Southeast Asian',
    'South Asian',
    'Native Hawaiian/Pacific Islander',
    'Native American/Alaskan',
    'White',
    'Prefer not to say'
  ];

  const YES_NO_DECLINE = ['Yes', 'No', 'Decline to state'];
  const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Decline to state'];
  ### Subtask 4.3: Add State Variables
- [x] Add after existing state variables (around line 68):ipt
  // Work Authorization
  const [workAuthUS, setWorkAuthUS] = useState<boolean | null>(null);
  const [workAuthCanada, setWorkAuthCanada] = useState<boolean | null>(null);
  const [workAuthUK, setWorkAuthUK] = useState<boolean | null>(null);
  const [requiresSponsorship, setRequiresSponsorship] = useState<boolean | null>(null);
  
  // Demographics
  const [ethnicity, setEthnicity] = useState('');
  const [hasDisability, setHasDisability] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [isVeteran, setIsVeteran] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [isLgbtq, setIsLgbtq] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-Binary' | 'Decline to state' | ''>('');
  
  // Location & Personal
  const [currentLocation, setCurrentLocation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  ---

## Task 5: Registration Form - Step 7 UI

### Subtask 5.1: Create Step 7 Card Structure
- [x] Find where Step 6 ends in the form JSX
- [x] Add Step 7 card with CardHeader and CardContent
- [x] Use same styling pattern as other steps
- [x] Add FileText icon in header

### Subtask 5.2: Work Authorization Section
- [x] Add section title: "Work Authorization"
- [x] Add 4 question groups:
  1. "Are you authorized to work in the US?" (Yes/No buttons)
  2. "Are you authorized to work in Canada?" (Yes/No buttons)
  3. "Are you authorized to work in the United Kingdom?" (Yes/No buttons)
  4. "Will you now or in the future require sponsorship for employment visa status?" (Yes/No buttons)
- [x] Style buttons to show selected state (use variant="default" when selected)
- [x] Use Button components with onClick handlers

### Subtask 5.3: Demographics Section
- [x] Add section title: "Demographics"
- [x] Add 5 question groups with Select dropdowns:
  1. "What is your ethnicity?" (use ETHNICITY_OPTIONS)
  2. "Do you have a disability?" (use YES_NO_DECLINE)
  3. "Are you a veteran?" (use YES_NO_DECLINE)
  4. "Do you identify as LGBTQ+?" (use YES_NO_DECLINE)
  5. "What is your gender?" (use GENDER_OPTIONS)
- [x] Use Select, SelectTrigger, SelectValue, SelectContent, SelectItem components
- [x] Add proper labels with Label component

### Subtask 5.4: Additional Information Section
- [x] Add section title: "Additional Information"
- [x] Add "Where are you currently located?" input field
  - Use Input component
  - Placeholder: "Type city to search"
- [x] Add "What's your date of birth?" input field
  - Use Input component with type="date"
- [x] Add "What's your phone number?" input group
  - Use flex container with Select (country code) and Input (phone number)
  - Country code Select with common options (+1, +44, +33, etc.)
  - Phone Input with placeholder: "Please enter valid phone number"
  - Update existing phone state to work with country code

### Subtask 5.5: Add Visual Separators
- [x] Add border-t border-slate-200 between sections
- [x] Add proper spacing (space-y-4, pt-4) between sections

---

## Task 6: Update Form Submission

### Subtask 6.1: Update handleSubmit Function
- [x] Find `handleSubmit` function (around line 245)
- [x] In the `profileApi.updateProfile` call, add new fields:pescript
  work_auth_us: workAuthUS ?? undefined,
  work_auth_canada: workAuthCanada ?? undefined,
  work_auth_uk: workAuthUK ?? undefined,
  requires_sponsorship: requiresSponsorship ?? undefined,
  ethnicity: ethnicity || undefined,
  has_disability: hasDisability || undefined,
  is_veteran: isVeteran || undefined,
  is_lgbtq: isLgbtq || undefined,
  gender: gender || undefined,
  current_location: currentLocation || undefined,
  date_of_birth: dateOfBirth || undefined,
  phone_country_code: phoneCountryCode || undefined,
  ### Subtask 6.2: Update Phone Number Handling
- [x] Ensure phone number includes country code when saving
- [x] Update phone validation if needed

### Subtask 6.3: Test Form Submission
- [x] Code structure verified - all fields included in submission
- [x] Backend endpoint verified - UpdateProfile model includes all new fields
- [x] Database schema verified - all columns exist in user_profile table
- [ ] **Manual Testing Required**: Verify all fields are sent to backend (check network tab)
- [ ] **Manual Testing Required**: Check backend receives data correctly (check backend logs)
- [ ] **Manual Testing Required**: Verify data saves to database (check Supabase database)

---

## Task 7: Chrome Extension Dialog Component

### Subtask 7.1: Create ExtensionDownloadDialog Component
- [x] Create file: `frontend/src/components/Auth/ExtensionDownloadDialog.tsx`
- [x] Import necessary components:
  - Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription from '@/components/ui/dialog'
  - Button from '@/components/ui/button'
  - Icons: CheckCircle, Download, Chrome from 'lucide-react'
  - ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg'
- [x] Create interface: `ExtensionDownloadDialogProps` with `open` and `onClose`

### Subtask 7.2: Implement Extension Detection
- [x] Add state: `isInstalled` (boolean) and `checking` (boolean)
- [x] Add useEffect to check extension on dialog open
- [x] Implement check logic:
  - Try to communicate with extension via chrome.runtime.sendMessage
  - Handle case where extension doesn't exist
  - Set `isInstalled` based on response
  - Set `checking` to false when done

### Subtask 7.3: Create Dialog UI
- [x] Add Dialog component with proper styling
- [x] Add logo image in header
- [x] Add conditional title:
  - "Extension Installed!" if installed
  - "Download Chrome Extension" if not installed
- [x] Add conditional description
- [x] Add conditional button:
  - "Currently Installed" (with CheckCircle icon) if installed
  - "Download Extension" (with Download icon) if not installed
- [x] Add loading state while checking

### Subtask 7.4: Implement Download Handler
- [x] Create `handleDownload` function
- [x] Open Chrome Web Store URL in new tab
- [x] Replace placeholder URL with actual extension store URL (placeholder added - needs actual URL)

### Subtask 7.5: Test Extension Detection
- [x] Code verified - extension detection logic implemented with timeout
- [x] Code verified - loading state properly handled
- [x] Code verified - dialog open/close functionality implemented
- [ ] **Manual Testing Required**: Test with extension installed (verify detection works)
- [ ] **Manual Testing Required**: Test with extension not installed (verify shows download button)
- [ ] **Manual Testing Required**: Test loading state (verify spinner shows during check)
- [ ] **Manual Testing Required**: Verify dialog opens/closes correctly

---

## Task 8: Integrate Dialog into Registration Form

### Subtask 8.1: Import Dialog Component
- [x] In `RegistrationComplete.tsx`, add import:cript
  import { ExtensionDownloadDialog } from './ExtensionDownloadDialog';
  ### Subtask 8.2: Add Dialog State
- [x] Add state: `const [showExtensionDialog, setShowExtensionDialog] = useState(false);`

### Subtask 8.3: Show Dialog After Successful Submission
- [x] In `handleSubmit` function, after successful profile update
- [x] After navigating or showing success message
- [x] Add: `setShowExtensionDialog(true);`

### Subtask 8.4: Add Dialog to JSX
- [x] Before closing tag of main component return
- [x] Add: `<ExtensionDownloadDialog open={showExtensionDialog} onClose={() => setShowExtensionDialog(false)} />`
- [x] Added navigation to resume builder after dialog closes

### Subtask 8.5: Test Integration
- [x] Code verified - import statement added correctly
- [x] Code verified - dialog state properly initialized
- [x] Code verified - dialog triggered after successful profile completion
- [x] Code verified - dialog component added to JSX with proper props
- [x] Code verified - navigation to resume builder happens after dialog closes
- [ ] **Manual Testing Required**: Complete full registration flow (Steps 1-7)
- [ ] **Manual Testing Required**: Verify dialog appears after form submission
- [ ] **Manual Testing Required**: Test dialog close functionality (verify navigation works)

---

## Task 9: Update Phone Number Field in Step 1

### Subtask 9.1: Modify Existing Phone Input
- [x] Find phone input field in Step 1 (around line 505)
- [x] Replace single Input with flex container
- [x] Add Select for country code (use phoneCountryCode state)
- [x] Keep existing phone Input but update to work with country code
- [x] Add proper styling and spacing

### Subtask 9.2: Add Common Country Codes
- [x] Add SelectContent with common country codes:
  - +1 (US/Canada)
  - +44 (UK)
  - +33 (France)
  - +49 (Germany)
  - +81 (Japan)
  - +86 (China)
  - +91 (India)
  - +61 (Australia)
  - +55 (Brazil)
  - +7 (Russia)
  - +82 (South Korea)
  - +34 (Spain)
  - +39 (Italy)
  - +31 (Netherlands)
  - +46 (Sweden)

### Subtask 9.3: Update Phone Validation
- [x] Phone validation works with country code (validation checks phone field, country code is separate)
- [x] Error messages remain appropriate (phone field validation unchanged)

---

## Task 10: Testing & Validation

### Subtask 10.1: Test All Form Fields
- [x] Code structure verified - all form fields implemented correctly
- [x] Code structure verified - all fields marked as optional (except Step 1 required fields)
- [x] Code structure verified - phone number field with country code in Step 1
- [x] Code structure verified - work authorization buttons implemented
- [x] Code structure verified - demographic dropdowns implemented
- [x] Code structure verified - location and date of birth fields implemented
- [ ] **Manual Testing Required**: Test each work authorization question (Yes/No)
- [ ] **Manual Testing Required**: Test each demographic dropdown
- [ ] **Manual Testing Required**: Test location input
- [ ] **Manual Testing Required**: Test date of birth picker
- [ ] **Manual Testing Required**: Test phone number with country code
- [ ] **Manual Testing Required**: Verify all fields are optional (no validation errors)

### Subtask 10.2: Test Form Flow
- [x] Code structure verified - step navigation logic implemented
- [x] Code structure verified - progress bar click handlers implemented
- [x] Code structure verified - form submission logic implemented
- [x] Code structure verified - validation for Step 1 required fields
- [ ] **Manual Testing Required**: Complete registration from Step 1 to Step 7
- [ ] **Manual Testing Required**: Verify navigation between steps works
- [ ] **Manual Testing Required**: Verify "Next" and "Previous" buttons work
- [ ] **Manual Testing Required**: Verify progress bar icons/names are clickable
- [ ] **Manual Testing Required**: Verify form submission works

### Subtask 10.3: Test Data Persistence
- [x] Code structure verified - all new fields included in handleSubmit
- [x] Code structure verified - backend models include all new fields
- [x] Code structure verified - database schema includes all new columns
- [x] Code structure verified - API endpoint configured to accept new fields
- [ ] **Manual Testing Required**: Submit form with all fields filled
- [ ] **Manual Testing Required**: Check database to verify all fields saved
- [ ] **Manual Testing Required**: Check network tab to verify all data sent
- [ ] **Manual Testing Required**: Reload page and verify data persists
- [ ] **Manual Testing Required**: Test with partial data (some fields empty)

### Subtask 10.4: Test Extension Dialog
- [x] Code structure verified - ExtensionDownloadDialog component created
- [x] Code structure verified - extension detection logic implemented with timeout
- [x] Code structure verified - dialog integrated into registration flow
- [x] Code structure verified - navigation to resume builder after dialog close
- [x] Code structure verified - loading state handling
- [ ] **Manual Testing Required**: Test with extension installed
- [ ] **Manual Testing Required**: Test with extension not installed
- [ ] **Manual Testing Required**: Test dialog close functionality
- [ ] **Manual Testing Required**: Test download button opens correct URL
- [ ] **Manual Testing Required**: Verify loading spinner displays during check

### Subtask 10.5: Cross-Browser Testing
- [x] Code structure verified - extension detection handles non-Chrome browsers gracefully
- [x] Code structure verified - no browser-specific code that would break in other browsers
- [ ] **Manual Testing Required**: Test in Chrome
- [ ] **Manual Testing Required**: Test in Firefox
- [ ] **Manual Testing Required**: Test in Safari
- [ ] **Manual Testing Required**: Verify extension detection works in Chrome
- [ ] **Manual Testing Required**: Verify graceful degradation in non-Chrome browsers

### Subtask 10.6: Mobile Responsiveness
- [x] Code structure verified - responsive classes used (flex, gap, etc.)
- [x] Code structure verified - input heights consistent (h-12)
- [x] Code structure verified - dialog uses responsive classes (sm:max-w-md)
- [ ] **Manual Testing Required**: Test form on mobile devices
- [ ] **Manual Testing Required**: Verify all inputs are accessible
- [ ] **Manual Testing Required**: Verify dialog displays correctly on mobile
- [ ] **Manual Testing Required**: Verify touch interactions work
- [ ] **Manual Testing Required**: Verify no horizontal scrolling issues

### Subtask 10.7: Testing Documentation
- [x] Created comprehensive testing checklist (TESTING_CHECKLIST.md)
- [x] Documented all test scenarios
- [x] Documented known issues and placeholders

---

## Task 11: Code Review Checklist

### Subtask 11.1: Code Quality
- [ ] All TypeScript types are correct
- [ ] No linter errors
- [ ] No console errors
- [ ] Proper error handling

### Subtask 11.2: UI/UX
- [ ] Consistent styling with existing form
- [ ] Proper spacing and alignment
- [ ] Accessible labels and inputs
- [ ] Clear visual feedback for selections

### Subtask 11.3: Data Privacy
- [ ] Sensitive data handled appropriately
- [ ] Optional fields clearly marked
- [ ] User can skip demographic questions

### Subtask 11.4: Documentation
- [ ] Code comments where needed
- [ ] Migration file has proper comments
- [ ] README updated if needed

---

## Notes for Implementation

1. **Extension ID**: Replace `YOUR_EXTENSION_ID` with actual Chrome Web Store extension ID
2. **Chrome Store URL**: Update download button URL with actual extension store URL
3. **Country Codes**: Consider using a library like `react-phone-number-input` for better phone input
4. **Date Picker**: Native HTML5 date input works, but consider `react-datepicker` for better UX
5. **Location Autocomplete**: Consider Google Places API for city autocomplete
6. **Privacy**: All demographic fields are optional - ensure users understand this
7. **Validation**: Work authorization fields are optional - no required validation needed

---

## Priority Order

1. **High Priority**: Tasks 1-6 (Database, Backend, Frontend Types, Form Fields, Submission)
2. **Medium Priority**: Tasks 7-8 (Extension Dialog, Integration)
3. **Low Priority**: Tasks 9-11 (Phone Update, Testing, Code Review)

---

## Estimated Time

- Database & Backend: 1-2 hours
- Frontend Types: 30 minutes
- Form UI: 2-3 hours
- Extension Dialog: 1-2 hours
- Integration & Testing: 1-2 hours
- **Total**: 6-10 hours

---

## Dependencies

- Supabase database access
- Chrome extension ID (for detection)
- Chrome Web Store URL (for download)
- UI components library (shadcn/ui)