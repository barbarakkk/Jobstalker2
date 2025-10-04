# Profile Page Component

## Overview

The Profile Page is a comprehensive, responsive user interface for managing professional profiles in the JobStalker2 job application tracking web app. It features a modern two-column layout with detailed descriptions for every section and function.

## Design Features

### Layout & Styling
- **Two-column responsive layout**: 25% sidebar, 75% main content on desktop
- **Mobile-first design**: Stacks vertically on small screens
- **Modern styling**: Clean white background with light blue accents
- **Professional typography**: Simple, readable fonts
- **Soft shadows and rounded corners**: Modern UI elements
- **Sticky sidebar**: Remains visible while scrolling on desktop

### Color Scheme
- **Primary background**: White (#FFFFFF)
- **Secondary background**: Light gray (#F9FAFB)
- **Accent color**: Light blue (#3B82F6)
- **Text colors**: Dark gray (#111827) for headings, medium gray (#6B7280) for body text
- **Success indicators**: Green (#10B981) for positive metrics
- **Warning indicators**: Purple (#8B5CF6) for offers

## Left Sidebar Components

### 1. Profile Picture & Basic Information
**Purpose**: Displays user's professional identity and basic details
**Features**:
- Circular profile picture with placeholder icon
- Editable profile picture with hover edit button
- Full name display (large, bold typography)
- Professional headline (subtitle)
- Location with map pin icon
- Responsive design that centers content

**Functionality**:
- Click edit button to change profile picture
- Displays user's current location
- Shows professional title/headline

### 2. Application Overview (Quick Stats)
**Purpose**: Provides at-a-glance metrics of job application progress
**Features**:
- Jobs Applied counter (24 applications)
- Interviews scheduled (8 interviews)
- Job offers received (2 offers)
- Color-coded metrics for visual distinction

**Functionality**:
- Real-time tracking of application metrics
- Visual progress indicators
- Motivational statistics display

### 3. Resume Upload Section
**Purpose**: Manages user's resume file for job applications
**Features**:
- Drag-and-drop upload area
- File type validation (.pdf, .doc, .docx)
- Upload progress indicator
- File name display with last updated date
- Replace and delete functionality

**Functionality**:
- Upload new resume files
- Replace existing resume
- Delete current resume
- Track last update timestamp
- File validation and error handling

## Right Main Content - Tabbed Interface

### Tab Navigation
**Purpose**: Organizes profile information into logical sections
**Features**:
- Horizontal tab bar with icons
- Active tab highlighting
- Responsive tab layout
- Smooth tab transitions

**Available Tabs**:
1. **Summary** - Professional overview
2. **Skills** - Technical expertise
3. **Experience** - Work history and education
4. **Preferences** - Job search preferences
5. **Account** - Account management

### 1. Summary Tab
**Purpose**: Professional summary and career overview
**Features**:
- Large text area for professional summary
- Character count guidance (150-200 characters recommended)
- Real-time editing with auto-save
- Professional writing tips

**Functionality**:
- Edit professional summary
- Character limit guidance
- Auto-save functionality
- Professional writing suggestions

### 2. Skills Tab
**Purpose**: Manage technical skills and expertise
**Features**:
- Tag-style skill display with remove buttons
- Add new skills with input field
- Skill categorization
- Visual skill chips with hover effects

**Functionality**:
- Add new skills by typing and pressing Enter
- Remove skills by clicking X button
- Skill validation and duplicate prevention
- Real-time skill updates

### 3. Experience Tab
**Purpose**: Manage work experience and education history
**Features**:
- Work experience cards with edit functionality
- Education history display
- Add new experience/education buttons
- Chronological ordering

**Work Experience Section**:
- Job title and company name
- Employment dates (start - end/present)
- Edit functionality for each entry
- Add new experience button

**Education Section**:
- Degree and field of study
- Institution name
- Graduation year
- Add new education button

### 4. Preferences Tab
**Purpose**: Configure job search preferences and requirements
**Features**:
- Desired job titles with tag input
- Employment type selector
- Work location preference
- Salary range slider

**Desired Job Titles**:
- Tag-style input for job titles
- Add/remove functionality
- Job matching optimization

**Employment Type**:
- Full-time, Part-time, Contract, Internship, Freelance options
- Dropdown selector with clear labels

**Work Location Preference**:
- Remote, Hybrid, On-site options
- Clear preference selection

**Salary Expectations**:
- Minimum and maximum salary inputs
- Formatted salary range display
- Currency formatting

### 5. Account Tab
**Purpose**: Manage account settings and security
**Features**:
- Connected accounts management
- Security settings
- Account deletion (danger zone)

**Connected Accounts**:
- Google account connection status
- LinkedIn account connection
- Connect/disconnect functionality
- Account integration benefits

**Security Section**:
- Password change functionality
- Account security settings
- Security recommendations

**Danger Zone**:
- Account deletion with confirmation dialog
- Clear warning about data loss
- Irreversible action confirmation

## Responsive Design

### Desktop Layout (lg and above)
- Two-column layout (25% sidebar, 75% main content)
- Sticky sidebar navigation
- Horizontal tab navigation
- Full feature set available

### Tablet Layout (md)
- Responsive grid adjustments
- Maintained sidebar functionality
- Optimized tab navigation

### Mobile Layout (sm and below)
- Single-column stacked layout
- Collapsible sidebar
- Vertical tab navigation
- Touch-optimized interactions

## Interactive Features

### Form Validation
- Real-time input validation
- Error message display
- Required field indicators
- Character limit enforcement

### File Upload
- Drag-and-drop functionality
- File type validation
- Progress indicators
- Error handling

### Data Persistence
- Auto-save functionality
- Local storage backup
- Cloud synchronization
- Data recovery options

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Technical Implementation

### State Management
- React useState for local state
- TypeScript interfaces for type safety
- Form validation and error handling
- Real-time updates

### Component Architecture
- Modular component design
- Reusable UI components
- Consistent styling patterns
- Performance optimization

### Integration Points
- API integration for data persistence
- File upload service integration
- Authentication system integration
- Notification system integration

## Usage Instructions

### For Users
1. **Profile Setup**: Complete all profile sections for optimal job matching
2. **Regular Updates**: Keep information current for better opportunities
3. **Resume Management**: Upload and maintain current resume
4. **Preferences**: Set accurate job preferences for better matching
5. **Security**: Regularly update password and review connected accounts

### For Developers
1. **Component Import**: `import { ProfilePage } from '@/components/Profile'`
2. **Routing**: Add to application routes
3. **Styling**: Uses TailwindCSS and Shadcn/UI components
4. **Customization**: Modify styling and functionality as needed

## Future Enhancements

### Planned Features
- Profile completion percentage indicator
- Skill endorsements from connections
- Portfolio integration
- Advanced analytics dashboard
- Multi-language support
- Dark mode theme
- Profile sharing functionality
- Integration with job boards

### Performance Optimizations
- Lazy loading for large datasets
- Image optimization for profile pictures
- Caching strategies for better performance
- Progressive web app features

## Support & Maintenance

### Documentation
- Component API documentation
- Usage examples and best practices
- Troubleshooting guide
- Performance optimization tips

### Testing
- Unit tests for all components
- Integration tests for user flows
- Accessibility testing
- Cross-browser compatibility testing

This Profile Page component provides a comprehensive, user-friendly interface for managing professional profiles with detailed descriptions and functionality for every section, ensuring users can effectively manage their job application information and preferences.

