# JOB APPLICATION TRACKER - FRONTEND PRD
## CURSOR: FOLLOW THIS DOCUMENT STRICTLY - NO DEVIATIONS

### PROJECT STATUS
✅ **Setup Complete:** Vite + React + TypeScript + Tailwind + shadcn/ui  
📁 **Working Directory:** `jobstalker/frontend/`  
🎯 **Current Task:** Ready to start development

---

## CRITICAL RULES FOR CURSOR

### 🚨 MANDATORY PROTOTYPE CONSULTATION
**BEFORE implementing ANY component, you MUST:**
1. Ask user to describe the prototype/design for that component
2. Wait for detailed description
3. Confirm understanding
4. Only THEN start coding

### 🎯 STRICT DEVELOPMENT ORDER
Follow the numbered phases exactly. Do not skip ahead or change order.

### 💻 TECHNICAL REQUIREMENTS
- **React** (functional components + hooks only)
- **TypeScript** (strict typing, interfaces for all data)
- **Tailwind CSS** (utility classes only)
- **shadcn/ui** (for all UI components)
- **No external libraries** without approval

---

## BACKEND INTEGRATION SPECS

### API Endpoints
```
Authentication:
POST /auth/login    → { email, password } → { token }
POST /auth/register → { email, password } → { token }

Jobs (All require Authorization: Bearer {token}):
GET    /jobs        → Job[]
POST   /jobs        → CreateJobData → Job
GET    /jobs/{id}   → Job
PUT    /jobs/{id}   → UpdateJobData → Job
DELETE /jobs/{id}   → success
```

### Authentication Flow
1. User logs in → receive JWT token
2. Store token in localStorage
3. Include in all API requests: `Authorization: Bearer {token}`
4. Redirect to login if token invalid/expired

---

## PHASE 1: FOUNDATION (START HERE)

### Task 1.1: Landing Page Component
**File:** `src/components/LandingPage.tsx`

**BEFORE CODING:** Ask user for landing page prototype description

**Requirements:**
- Hero section with app introduction
- Features showcase
- Clear CTA buttons (Login/Register)
- Fully responsive
- Use shadcn/ui components

### Task 1.2: Landing Sub-components
**Folder:** `src/components/Landing/`
```
Landing/
├── Hero.tsx
├── Features.tsx  
├── CallToAction.tsx
└── index.ts
```

### Task 1.3: Authentication Pages
**Folder:** `src/components/Auth/`

**BEFORE CODING:** Ask user for login/register prototypes

**Files:**
```
Auth/
├── Login.tsx     (integrates POST /auth/login)
├── Register.tsx  (integrates POST /auth/register)
└── index.ts
```

**Requirements:**
- Form validation
- Loading states
- Error handling
- JWT token storage
- Redirect on success

### Task 1.4: App Shell & Protected Routes
**Files:**
```
src/components/Layout/
├── Header.tsx
├── Navigation.tsx
├── AppShell.tsx
└── index.ts

src/components/ProtectedRoute.tsx
```

---

## PHASE 2: JOB MANAGEMENT

### Task 2.1: Job Components
**Folder:** `src/components/Jobs/`

**BEFORE CODING:** Ask user for job management prototypes

**Files:**
```
Jobs/
├── JobList.tsx      (GET /jobs)
├── JobForm.tsx      (POST /jobs, PUT /jobs/{id})
├── JobDetails.tsx   (GET /jobs/{id})
├── JobCard.tsx      (display component)
└── index.ts
```

### Task 2.2: Dashboard
**Folder:** `src/components/Dashboard/`

**BEFORE CODING:** Ask user for dashboard prototype

**Files:**
```
Dashboard/
├── Dashboard.tsx
├── StatsCard.tsx
├── RecentJobs.tsx
└── index.ts
```

---

## PHASE 3: INFRASTRUCTURE

### Task 3.1: API Layer
**Files:**
```
src/lib/
├── api.ts           (all API functions)
├── auth.ts          (auth utilities)
├── types.ts         (TypeScript interfaces)
└── constants.ts     (endpoints, configs)
```

### Task 3.2: Routing Setup
**Files:**
```
src/App.tsx          (main router)
src/routes/
├── PublicRoute.tsx
└── PrivateRoute.tsx
```

---

## MANDATORY CODE PATTERNS

### TypeScript Interface Template
```typescript
interface Job {
  id: string;
  title: string;
  company: string;
  status: 'applied' | 'interview' | 'rejected' | 'offer';
  applicationDate: string;
  // ... other fields
}
```

### API Call Template
```typescript
export async function apiCall(data: any): Promise<ResponseType> {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('API call failed');
    }
    
    return response.json();
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}
```

### Component Template
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  // define props here
}

export function ComponentName({ }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API calls, event handlers here
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="container mx-auto p-4">
      {/* Component JSX using shadcn/ui */}
    </div>
  );
}
```

### Error Handling Pattern
```typescript
try {
  setLoading(true);
  setError(null);
  const result = await apiCall(data);
  // handle success
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
} finally {
  setLoading(false);
}
```

---

## FILE STRUCTURE TARGET
```
frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx
│   │   ├── Landing/
│   │   ├── Auth/
│   │   ├── Jobs/
│   │   ├── Dashboard/
│   │   ├── Layout/
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── routes/
│   ├── App.tsx
│   └── main.tsx
```

---

## SUCCESS CRITERIA
- [ ] Users can access landing page
- [ ] Users can register/login/logout
- [ ] Protected routes work correctly
- [ ] Users can CRUD jobs via API
- [ ] Dashboard shows job statistics
- [ ] All components are responsive
- [ ] Error states handled gracefully
- [ ] Loading states implemented

---

## CURSOR: YOUR FIRST ACTION
Ask user: **"Please describe the landing page prototype. What sections should it have? What should the design look like? What content and features should be included?"**

Wait for detailed description before coding anything.