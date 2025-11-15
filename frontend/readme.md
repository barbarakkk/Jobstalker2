# JobStalker Frontend System

## Overview

The JobStalker frontend is a modern React-based single-page application (SPA) built with TypeScript, Vite, and Tailwind CSS. It provides a comprehensive user interface for job tracking, profile management, resume building, and statistics visualization.

## Architecture

### Technology Stack

- **Framework**: React 19.1.0
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS 4.1.11
- **Routing**: React Router DOM 7.7.1
- **State Management**: React Context API + Hooks
- **UI Components**: Radix UI primitives
- **Charts**: Chart.js 4.5.0 + react-chartjs-2
- **Authentication**: Supabase Auth
- **API Client**: Fetch API with custom wrapper

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/            # Authentication components
│   │   ├── Dashboard/       # Dashboard and Kanban board
│   │   ├── Jobs/           # Job management components
│   │   ├── Landing/        # Landing page components
│   │   ├── Layout/         # Layout components (Header, etc.)
│   │   ├── Profile/         # Profile management
│   │   ├── ResumeBuilder/  # Resume builder wizard and editor
│   │   ├── Statistics/     # Statistics and analytics
│   │   └── ui/             # Reusable UI components
│   ├── lib/                # Utility libraries
│   │   ├── api.ts          # API client wrapper
│   │   ├── supabaseClient.ts  # Supabase client
│   │   ├── types.ts        # TypeScript type definitions
│   │   ├── utils.ts        # Utility functions
│   │   ├── statistics.ts   # Statistics calculations
│   │   └── jsonresume.ts  # JSON Resume utilities
│   ├── types/              # Type definitions
│   ├── contexts/          # React contexts
│   ├── assets/            # Static assets (images, logos)
│   ├── App.tsx            # Main app component
│   └── main.tsx          # Application entry point
├── public/                # Public assets
├── dist/                 # Build output
└── package.json          # Dependencies and scripts
```

## Key Features

### 1. Authentication System

- **Login/Register**: Supabase Auth integration
- **Protected Routes**: Route guards for authenticated users
- **Extension Auth**: Special authentication flow for browser extension
- **Session Management**: Automatic token refresh and session handling

**Components**:
- `Login.tsx` - User login form
- `Register.tsx` - User registration form
- `ProtectedRoute.tsx` - Route protection wrapper
- `AuthCallback.tsx` - OAuth callback handler
- `ExtensionAuth.tsx` - Extension-specific auth flow

### 2. Dashboard & Job Management

- **Kanban Board**: Visual job status tracking (Bookmarked, Applied, Interviewing, Accepted, Rejected)
- **Job Cards**: Display job details with status, excitement level, company info
- **Job Details**: Detailed view with full job description
- **Recent Jobs**: Quick access to recently added jobs
- **Stats Cards**: Overview statistics (total jobs, interviews, offers)

**Components**:
- `Dashboard.tsx` - Main dashboard view
- `KanbanBoard.tsx` - Drag-and-drop Kanban board
- `FullScreenKanban.tsx` - Full-screen Kanban view
- `JobDetail.tsx` - Individual job detail page
- `RecentJobs.tsx` - Recent jobs list
- `StatsCard.tsx` - Statistics display cards
- `AddJobModal.tsx` - Add new job modal
- `JobForm.tsx` - Job form component

### 3. Profile Management

- **Profile Page**: Edit user profile information
- **Skills Management**: Add, edit, delete skills with proficiency levels
- **Work Experience**: Manage work history with dates and descriptions
- **Education**: Track educational background
- **Profile Picture**: Upload and manage profile photos

**Components**:
- `ProfilePage.tsx` - Main profile management page

### 4. Resume Builder

The resume builder is a comprehensive multi-step wizard system:

#### Template Selection
- Browse available resume templates
- Preview templates before selection
- Template categories and metadata

#### Wizard Flow
- **Step 1: Personal Info** - Name, contact, location, job title
- **Step 2: Summary** - Professional summary with AI generation
- **Step 3: Work Experience** - Add work history entries
- **Step 4: Education** - Add educational background
- **Step 5: Skills** - Add skills with categories

#### AI Generation
- AI-powered resume generation
- Professional summary generation
- Work experience enhancement
- Target role customization

#### Editor
- Real-time resume preview
- Editable sections
- Template-specific styling
- Multiple template support

**Components**:
- `TemplateSelection.tsx` - Template selection page
- `Wizard.tsx` - Multi-step wizard container
- `AIGenerate.tsx` - AI resume generation page
- `Edit.tsx` - Resume editor with preview
- `Finalize.tsx` - Final resume review and export
- `TemplateRenderer.tsx` - Template rendering engine
- `ResumeBuilderContext.tsx` - Resume builder state management

**Templates Supported**:
- JSON Resume templates (classy, elegant, flat, kendall, modern, paper, short, spartan, stackoverflow)
- Custom templates (Clean Impact)

### 5. Statistics & Analytics

- **KPI Cards**: Key performance indicators
- **Job Status Pie Chart**: Visual breakdown of job statuses
- **Conversion Metrics**: Application to interview to offer conversion rates
- **Pipeline Funnel**: Visual funnel of job application pipeline
- **AI Insights**: AI-generated insights about job search
- **Recent Activity**: Timeline of recent actions

**Components**:
- `Statistics.tsx` - Main statistics page
- `KPICards.tsx` - KPI display cards
- `JobStatusPieChart.tsx` - Status distribution chart
- `ConversionMetrics.tsx` - Conversion rate metrics
- `PipelineFunnel.tsx` - Pipeline visualization
- `AIInsights.tsx` - AI-powered insights
- `RecentActivity.tsx` - Activity timeline

### 6. Landing Page

- **Hero Section**: Main value proposition
- **Features**: Feature highlights
- **Stats Section**: Platform statistics
- **Call to Action**: Sign-up prompts

**Components**:
- `LandingPage.tsx` - Main landing page
- `Hero.tsx` - Hero section
- `Features.tsx` - Features showcase
- `StatsSection.tsx` - Statistics display
- `CallToAction.tsx` - CTA section

## Routing

The application uses React Router DOM for client-side routing:

```typescript
/                    → LandingPage
/login               → Login
/register            → Register
/auth/extension       → ExtensionAuth
/auth/callback        → AuthCallback
/dashboard           → Dashboard (protected)
/statistics          → Statistics (protected)
/jobs/:id            → JobDetail (protected)
/profile             → ProfilePage (protected)
/resume-builder      → AIGeneratePage (protected)
/resume-builder/templates → TemplateSelection (protected)
/resume-builder/wizard    → AIGeneratePage (protected)
/resume-builder/edit      → ResumeEditPage (protected)
/resume-builder/finalize  → FinalizePage (protected)
```

## API Integration

### API Client (`lib/api.ts`)

The frontend uses a centralized API client that:

- Automatically adds authentication tokens
- Handles errors gracefully
- Provides TypeScript type safety
- Supports debug logging in development

**Key Functions**:
- `getJobs()` - Fetch all jobs
- `createJob()` - Create new job
- `updateJob()` - Update job
- `deleteJob()` - Delete job
- `getProfile()` - Get user profile
- `updateProfile()` - Update profile
- `getSkills()` - Get skills
- `addSkill()` - Add skill
- `getExperience()` - Get work experience
- `addExperience()` - Add work experience
- `getEducation()` - Get education
- `addEducation()` - Add education
- `generateResume()` - AI resume generation
- `saveResume()` - Save resume

### Supabase Client (`lib/supabaseClient.ts`)

Direct Supabase integration for:
- Authentication
- Real-time subscriptions (future)
- File storage access

## State Management

### React Context API

- **ResumeBuilderContext**: Manages resume builder state across wizard steps
- **Auth Context**: User authentication state (via Supabase)

### Local State

- Component-level state using `useState` hooks
- Form state management
- UI state (modals, dropdowns, etc.)

## Styling

### Tailwind CSS

- Utility-first CSS framework
- Custom configuration in `tailwind.config.js`
- Responsive design with mobile-first approach
- Dark mode support (future)

### Component Styling

- Radix UI components for accessibility
- Custom UI components in `components/ui/`
- Consistent design system

## UI Components Library

Reusable components in `components/ui/`:

- `button.tsx` - Button component
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `select.tsx` - Dropdown selects
- `textarea.tsx` - Text areas
- `tabs.tsx` - Tab navigation
- `badge.tsx` - Badge component
- `separator.tsx` - Visual separator
- `stat-card.tsx` - Statistics card
- `checkbox.tsx` - Checkbox input

## Development

### Prerequisites

- Node.js 18+ and npm
- Backend API running (or use production API)
- Supabase project configured

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_API_BASE_URL=http://localhost:8000  # or production URL
VITE_DEBUG_API=false  # Set to true for API call debugging
```

### Development Server

```bash
npm run dev
```

Runs on `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Output in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel Deployment

The frontend is configured for Vercel deployment:

1. **vercel.json**: Deployment configuration
2. **Environment Variables**: Set in Vercel dashboard
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Environment Variables in Production

Set in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_DEBUG_API` (optional)

## Performance Optimizations

1. **Code Splitting**: Route-based code splitting
2. **Lazy Loading**: Components loaded on demand
3. **Image Optimization**: Optimized asset loading
4. **Bundle Size**: Tree shaking and minification
5. **Caching**: API response caching strategies

## Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Error Handling

### API Errors

- User-friendly error messages
- Automatic retry for network errors
- Token refresh on authentication errors
- Error boundaries for React errors

### Form Validation

- Client-side validation
- Real-time error feedback
- Server-side error handling
- User-friendly error messages

## Testing

### Manual Testing

- Component testing in development
- Integration testing with backend
- End-to-end user flows

### Future Testing

- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## Future Enhancements

- [ ] Dark mode support
- [ ] Offline functionality with service workers
- [ ] Push notifications
- [ ] Advanced filtering and search
- [ ] Export jobs to CSV/PDF
- [ ] Calendar integration
- [ ] Email integration
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard

