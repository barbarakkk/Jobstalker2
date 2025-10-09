## 📋 Product Requirements Document: Resume Builder Flow

### 🎯 Overview
Implement a complete resume builder feature flow from the main navigation through template selection to resume upload and editing interface.

### 👥 User Persona
- **Job seeker** who wants to create or update their resume using professional templates
- **User state**: Logged into JobStalker2 application

### 📱 User Flow Specification

#### **Step 1: Header Navigation**
**Current Header Structure:**
```
[Logo] Dashboard | Jobs | Profile | Analytics | [Resume Builder] | User Avatar
```

**Requirements:**
- Add "Resume Builder" as a navigation item in the main header
- Position it between "Analytics" and "User Avatar" 
- Maintain consistent styling with other navigation items
- Clicking navigates to `/resume-builder` route

#### **Step 2: Template Selection Page (`/resume-builder`)**
**Layout:**
```
┌────────────────────────────────────────┐
│           Resume Templates             │
├────────────────────────────────────────┤
│ [Template 1]  [Template 2]  [Template 3]│
│   SC-N1        SC-N2        SC-N3      │
│                                        │
│ [Template 4]  [Template 5]  [Template 6]│
│   SC-N4        SC-N5        SC-N6      │
└────────────────────────────────────────┘
```

**Template Card Components:**
- Template preview image/thumbnail
- Template name (e.g., "SC-N1", "SC-N2")
- Hover state reveals "Use This Template" button
- Clicking button navigates to `/resume-builder/create?template=SC-N1`

#### **Step 3: Resume Creation Method Selection (`/resume-builder/create`)**
**Page Content:**
```
┌────────────────────────────────────────┐
│    How will you make your resume?      │
├────────────────────────────────────────┤
│                                        │
│   [ ] Create from scratch              │
│   [ ] Use AI Assistant                 │
│   [✓] I already have a resume          │
│                                        │
│        [Upload Your Resume]            │
│                                        │
│   Supported formats: PDF, HTML, DOCX, TXT │
└────────────────────────────────────────┘
```

**Requirements:**
- Radio button selection for resume creation method
- "I already have a resume" pre-selected by default
- "Upload Your Resume" primary button
- Supported formats clearly displayed
- Clicking upload button navigates to `/resume-builder/upload`

#### **Step 4: File Upload Page (`/resume-builder/upload`)**
**Components:**
```
┌────────────────────────────────────────┐
│          Upload Your Resume            │
├────────────────────────────────────────┤
│                                        │
│    ┌──────────────────────┐            │
│    │                      │            │
│    │   Drag & Drop        │            │
│    │   Your Resume Here   │            │
│    │                      │            │
│    │   or browse files    │            │
│    └──────────────────────┘            │
│                                        │
│   Supported: PDF, HTML, DOCX, TXT      │
│   Max file size: 5MB                   │
│                                        │
│   [Back]                     [Next]    │
└────────────────────────────────────────┘
```

**Technical Requirements:**
- Drag-and-drop file upload interface
- File type validation: `.pdf`, `.html`, `.docx`, `.txt`
- File size limit: 5MB
- Visual feedback during upload
- Error handling for invalid files
- Successful upload navigates to `/resume-builder/edit`

### 🎨 Design & UX Requirements

#### **Visual Design**
- Consistent with existing JobStalker2 design system
- Use Tailwind CSS and Shadcn/UI components
- Responsive design for mobile/tablet
- Loading states for all transitions

#### **User Experience**
- Clear breadcrumb navigation: `Resume Builder → Templates → Create → Upload → Edit`
- Progress indicator showing current step
- Instant feedback on user actions
- Error messages with helpful guidance

### 🔧 Technical Specifications

#### **Frontend Routes**
```typescript
// Route structure
/resume-builder                    // Template selection
/resume-builder/create            // Method selection  
/resume-builder/upload            // File upload
/resume-builder/edit              // Editing interface (future)
```

#### **File Upload API**
```python
# Backend endpoint needed
POST /api/resume/upload
- Accepts: multipart/form-data
- Validates: file type, size
- Stores: In Supabase Storage
- Returns: file_id, extracted text/content
```

#### **State Management**
- Track selected template across flow
- Store uploaded file reference
- Maintain user progress through steps

### 📊 Success Metrics
- **Completion rate**: % of users who complete resume upload flow
- **Time to upload**: Average time from template selection to successful upload
- **Error rate**: % of failed uploads with reasons
- **User satisfaction**: Feedback on upload experience

### 🚀 Phase 1 Deliverables
1. ✅ Header navigation item
2. ✅ Template selection page
3. ✅ Creation method selection  
4. ✅ File upload interface
5. ✅ Basic file validation
6. ✅ Navigation between steps

### 🔮 Future Enhancements (Phase 2+)
- Resume parsing and auto-filling edit form
- AI-powered resume improvement suggestions
- Multiple resume versions
- Export functionality (PDF, Word)
- Resume sharing capabilities

---

**Next Steps**: Should I generate the detailed implementation tasks for this resume builder flow?