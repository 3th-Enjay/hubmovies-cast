HubMovies — Global Casting Marketplace
UI Prototype v0.1 | Live Demo | Production-grade cinematic interface

🌟 Project Vision
HubMovies exists to remove friction, opacity, and gatekeeping from global casting — replacing fragmented networks with a single, cinematic marketplace built for creatives. This UI prototype establishes the foundation for a premium, art-directed digital experience that feels intentional and human—not algorithmic.

Current Phase: Production-grade frontend prototype with mocked data. Backend, payments, and real database integration will follow.

🎬 Cinematic Aesthetic Rules
This project follows strict design principles to avoid "AI slop" and maintain artistic integrity.

Typography Rules
Primary Fonts: DM Sans (body) + Libre Baskerville (headings)

Philosophy: Bold, expressive, humanist typography defines the aesthetic

Avoid: Generic/system fonts (Inter, Roboto, Arial, Space Grotesk)

Approach: Editorial sensibility with character-rich typefaces

Color & Theme
Base: Dark cinematic (#0b0b0c)

Accents: Gold (#c7a24b), Red (#8f1d18)

Text: Primary (#f4f4f5), Secondary (#b5b5b7)

Rule: High-contrast dominant colors with selective accents

Avoid: Cliché AI palettes, overused gradients (purple→blue)

Motion & Interaction
Library: Framer Motion for React components

Philosophy: Purposeful animation only—no scattered or "sloppy" motions

Patterns:

Staggered reveal on page load

Fade-in + scale for hero elements

Subtle hover effects

Moving sheen across hero section

Avoid: Random or generic CSS animations

Background & Atmosphere
Base: Layered radial gradients + CSS procedural noise (no external files)

Hero: Pexels cinematic image + animated sheen overlay

Video: Deferred until user onboarding (Coverr for future motion headers)

Goal: Depth, ambiance, and identity through layered textures

Avoid: Flat solid-color backgrounds, placeholder/lorem ipsum text

🛠 Tech Stack
Core Framework

Next.js 16 (App Router)

TypeScript

Tailwind CSS

UI & Components

shadcn/ui for accessible components

Framer Motion for animations

Custom cinematic components

State & Validation

Zustand (auth, role, access level, verification, payments)

Zod for form validation

Media Sources

Portraits: Unsplash

Cinematic backgrounds: Pexels

Motion headers: Coverr (future)

Data

JSON / in-memory mocked state

Realistic global dataset

✅ Implemented Features
Global Foundation
✅ Typography system locked (DM Sans + Libre Baskerville)

✅ Global CSS procedural noise background

✅ Cinematic sheen animation system

✅ Responsive, dark-first design system

✅ Tailwind design tokens established

Header / Navigation
✅ Fixed transparent cinematic header with backdrop blur

✅ Smooth fade-down animation on page load

✅ Logo with gold accent

✅ Navigation: Jobs, Talents, How It Works, Pricing

✅ Action buttons: Sign In, Get Started

✅ Fully responsive (hamburger menu on mobile)

Hero Section
✅ Full-screen cinematic landing

✅ Motion layers: image fade + scale, moving sheen

✅ Dark overlay for readability

✅ Animated title + subtitle with staggered reveal

✅ CTA buttons with hover effects

✅ No missing assets (pure CSS solutions)

Sources: Pexels (image), CSS (sheen)

Role System & Mock Data
typescript
type Role = "GUEST" | "TALENT" | "VERIFIED_TALENT" | "PRODUCER";
type AccessLevel = "FREE" | "PAID";
✅ 10 mock talents (global names)

✅ 5 mock producers

✅ 12 mock jobs (varied industries, realistic budgets)

✅ Global marketplace (no region lock)

📁 Architecture & Structure
```
hubmovies-cast/
├─ web/                          # Next.js application root
│  ├─ app/                       # Next.js App Router directory
│  │  ├─ api/                    # API routes
│  │  │  ├─ apply/
│  │  │  │  ├─ route.ts          # POST endpoint for job applications
│  │  │  │  └─ status/
│  │  │  │     └─ route.ts       # GET endpoint to check applied status
│  │  │  ├─ auth/
│  │  │  │  ├─ [...nextauth]/
│  │  │  │  │  └─ route.ts       # NextAuth.js authentication
│  │  │  │  ├─ complete/
│  │  │  │  │  └─ route.ts       # Complete signup flow
│  │  │  │  ├─ forgot-password/
│  │  │  │  │  └─ route.ts       # Password reset request
│  │  │  │  ├─ resend-verification/
│  │  │  │  │  └─ route.ts       # Resend email verification
│  │  │  │  └─ reset-password/
│  │  │  │     └─ route.ts       # Password reset handler
│  │  │  ├─ director/
│  │  │  │  ├─ applications/
│  │  │  │  │  ├─ route.ts       # GET director applications
│  │  │  │  │  ├─ [id]/
│  │  │  │  │  │  └─ route.ts    # PATCH update application status
│  │  │  │  │  └─ bulk/
│  │  │  │  │     └─ route.ts    # Bulk update applications
│  │  │  │  ├─ jobs/
│  │  │  │  │  ├─ route.ts       # GET/POST director jobs
│  │  │  │  │  └─ [id]/
│  │  │  │  │     └─ route.ts    # PATCH/DELETE job
│  │  │  │  ├─ messages/
│  │  │  │  │  ├─ route.ts       # POST send message
│  │  │  │  │  └─ threads/
│  │  │  │  │     └─ route.ts    # GET message threads
│  │  │  │  └─ profile/
│  │  │  │     └─ route.ts       # GET director profile/trust
│  │  │  ├─ jobs/
│  │  │  │  └─ route.ts          # GET public job listings
│  │  │  ├─ messages/
│  │  │  │  └─ route.ts          # GET messages (universal)
│  │  │  ├─ notifications/
│  │  │  │  ├─ route.ts          # GET/PATCH notifications
│  │  │  │  └─ unread-count/
│  │  │  │     └─ route.ts       # GET unread count
│  │  │  ├─ talent/
│  │  │  │  ├─ applications/
│  │  │  │  │  └─ route.ts        # GET talent applications
│  │  │  │  ├─ messages/
│  │  │  │  │  └─ route.ts       # GET talent messages
│  │  │  │  └─ profile/
│  │  │  │     ├─ route.ts       # GET/PATCH talent profile
│  │  │  │     └─ completion/
│  │  │  │        └─ route.ts     # GET profile completion
│  │  │  └─ upload/
│  │  │     └─ route.ts          # POST file upload to Cloudinary
│  │  ├─ auth/                    # Authentication pages
│  │  │  ├─ page.tsx             # Auth landing page
│  │  │  ├─ check-email/
│  │  │  │  └─ page.tsx          # Email check page
│  │  │  ├─ complete/
│  │  │  │  └─ page.tsx          # Complete signup page
│  │  │  ├─ email/
│  │  │  │  └─ page.tsx          # Email login page
│  │  │  ├─ error/
│  │  │  │  └─ page.tsx          # Auth error page
│  │  │  ├─ forgot-password/
│  │  │  │  └─ page.tsx          # Forgot password page
│  │  │  ├─ password/
│  │  │  │  └─ page.tsx          # Password login page
│  │  │  ├─ reset-password/
│  │  │  │  └─ [token]/
│  │  │  │     └─ page.tsx       # Reset password page
│  │  │  └─ verify-email/
│  │  │     └─ page.tsx          # Email verification page
│  │  ├─ components/             # React components
│  │  │  ├─ casting-director-verification-modal.tsx
│  │  │  ├─ create-casting-modal/
│  │  │  │  ├─ create-casting-modal.tsx
│  │  │  │  └─ step-basic.tsx
│  │  │  ├─ director/
│  │  │  │  └─ dashboard/
│  │  │  │     ├─ components/
│  │  │  │     │  ├─ application-row.tsx
│  │  │  │     │  ├─ applications-panel.tsx
│  │  │  │     │  ├─ director-stats.tsx
│  │  │  │     │  ├─ director-trust-panel.tsx
│  │  │  │     │  ├─ job-card.tsx
│  │  │  │     │  └─ job-list.tsx
│  │  │  │     ├─ modals/
│  │  │  │     │  ├─ create-job-modal.tsx
│  │  │  │     │  ├─ edit-job-modal.tsx
│  │  │  │     │  ├─ manage-applicants-modal.tsx
│  │  │  │     │  └─ message-modal.tsx
│  │  │  │     └─ page.tsx       # Director dashboard
│  │  │  ├─ header.tsx           # Fixed cinematic navigation
│  │  │  ├─ hero.tsx             # Full-screen cinematic hero
│  │  │  ├─ job-detail-modal.tsx # Job details modal
│  │  │  ├─ jobs-preview.tsx     # Jobs grid preview
│  │  │  ├─ modals/
│  │  │  │  ├─ apply-flow-modal.tsx  # Multi-step application flow
│  │  │  │  └─ modal-shell.tsx       # Reusable modal wrapper
│  │  │  ├─ notifications/
│  │  │  │  ├─ notification-bell.tsx   # Notification bell icon
│  │  │  │  └─ notification-dropdown.tsx  # Notification dropdown
│  │  │  ├─ talent/
│  │  │  │  └─ messages-view.tsx
│  │  │  ├─ talent-profile-modal.tsx # Talent profile modal
│  │  │  ├─ talents-preview.tsx      # Talents grid preview
│  │  │  └─ verification-upgrade-modal.tsx
│  │  ├─ director/
│  │  │  └─ messages/
│  │  │     └─ page.tsx          # Director messages page
│  │  ├─ how-it-works/
│  │  │  └─ page.tsx            # How It Works page
│  │  ├─ jobs/
│  │  │  └─ page.tsx            # Jobs listing page
│  │  ├─ pricing/
│  │  │  └─ page.tsx            # Pricing page
│  │  ├─ talent/
│  │  │  ├─ dashboard/
│  │  │  │  ├─ components/
│  │  │  │  │  ├─ application-detail-modal.tsx
│  │  │  │  │  └─ message-thread-modal.tsx
│  │  │  │  └─ page.tsx         # Talent dashboard
│  │  │  └─ profile/
│  │  │     └─ page.tsx         # Talent profile page
│  │  ├─ talents/
│  │  │  └─ page.tsx            # Talents directory page
│  │  ├─ favicon.ico
│  │  ├─ globals.css             # Theme, noise, sheen, typography
│  │  ├─ layout.tsx              # Root layout with SessionProvider
│  │  ├─ page.tsx                # Landing page
│  │  └─ providers.tsx           # SessionProvider wrapper
│  ├─ lib/                       # Utility libraries
│  │  ├─ auth-adapter.ts         # NextAuth Mongoose adapter
│  │  ├─ auth-helpers.ts         # Auth utility functions
│  │  ├─ cloudinary.ts           # Cloudinary media upload client
│  │  ├─ director-trust.ts       # Director trust system logic
│  │  ├─ email.ts                # Email sending utilities
│  │  ├─ mongodb.ts              # MongoDB connection handler
│  │  └─ profile-completion.ts   # Profile completion calculation
│  ├─ models/                    # Database models
│  │  ├─ application.ts          # Application schema/model
│  │  ├─ job.ts                  # Job posting schema
│  │  ├─ message.ts              # Message schema
│  │  ├─ notification.ts         # Notification schema
│  │  ├─ session.ts             # NextAuth session schema
│  │  ├─ user.ts                 # User schema
│  │  └─ verification-token.ts   # Email verification token schema
│  ├─ public/                    # Static assets
│  │  ├─ file.svg
│  │  ├─ globe.svg
│  │  ├─ next.svg
│  │  ├─ noise.png
│  │  ├─ vercel.svg
│  │  └─ window.svg
│  ├─ types/
│  │  └─ next-auth.d.ts         # NextAuth type definitions
│  ├─ eslint.config.mjs          # ESLint configuration
│  ├─ middleware.ts              # Next.js middleware (auth, verification)
│  ├─ next.config.ts             # Next.js configuration
│  ├─ next-env.d.ts              # Next.js TypeScript definitions
│  ├─ package.json               # Dependencies and scripts
│  ├─ postcss.config.mjs         # PostCSS configuration
│  ├─ README.md                  # Project documentation
│  └─ tsconfig.json              # TypeScript configuration
```
Global Styles (app/globals.css) includes:

Dark cinematic theme variables

Procedural noise background

Moving sheen animations

Typography scale (clamp() for responsiveness)

Global overflow-x: hidden

🚀 Development
Local Setup
bash
pnpm install
pnpm dev
Deployment
Built on Next.js 16

Compatible with Vercel, Netlify, etc.

Fonts imported in RootLayout.tsx

🔮 AI Continuation Guide
CRITICAL: All future development MUST respect these rules:

Design Continuity
Always reference <frontend_aesthetics> principles

Typography: Never revert to system fonts

Color: Maintain dark-cinematic base with gold/red accents

Motion: Use Framer Motion purposefully, avoid random animations

Background: Keep noise texture + sheen animations consistent

Media Sources
Portraits → Unsplash

Cinematic shots → Pexels

Motion headers → Coverr (defer video until onboarding)

Never use placeholder images or lorem ipsum

Component Rules
All buttons/CTAs trigger modals or mocked flows

Hero remains full-screen + animated until user onboarding

Maintain fixed cinematic header across all pages

Use global design tokens (CSS variables)

Page Creation Guide
When building new pages (Jobs, Talents, Pricing, How It Works, Auth, Dashboards):

Import global styles

Use established typography system

Apply cinematic color palette

Include purposeful motion

Mock backend flows with Zustand + JSON state

Ensure mobile → desktop responsiveness

Maintain hero/header consistency

State Management Pattern
typescript
// Zustand store structure
auth: { loggedIn: boolean }
role: Role
accessLevel: AccessLevel
verification: { status: boolean }
payments: { status: string }
Form Validation
Signup, Login (Zod schemas)

Post Job, Apply Job

Profile Edit, Contact forms

Always validate with Zod before mock submission

🎥 Media Attribution
All media is sourced from free platforms:

Pexels - Cinematic background images

Unsplash - Portrait photography

Coverr - Future motion video headers

Implementation Notes:

Noise background is pure CSS (no external file)

Hero video deferred—currently using animated sheen

All typography, motion, and color principles are locked

📝 Next Development Phase
Priority Pages to Build:

Jobs Listing & Detail

Talents Directory & Profiles

Pricing Plans

How It Works

Authentication Flows

Role-based Dashboards

Each must follow:

Cinematic aesthetic rules

Established component patterns

Mocked data flows

Responsive requirements

⚡ Performance Notes
CSS-based solutions preferred over external assets

Images optimized at source

Motion deferred where possible

Modular component architecture

Maintained with artistic intent. This interface rejects generic AI patterns in favor of human-directed cinematic design. Every element serves the narrative of connecting creative professionals in a global marketplace.

### Image Handling Rules

- Editorial UI sections (Hero, Talents, Jobs):
  → Use standard `<img>` tags for flexibility and portability

- Dashboard & authenticated areas:
  → Use `next/image` with configured CDNs

Reason:
Cinematic layouts prioritize visual freedom over aggressive optimization.
### Talent Profile Preview Modal

- Opens from Talents Preview cards
- Framer Motion animated entrance
- Editorial two-column layout
- Verification-gated content
- No route change (modal-based UX)

Purpose:
Reinforces premium access while preserving cinematic immersion.
Recommended changes (later)

Replace "TEMP_TALENT_ID" with the logged-in user ID.

Add proper validation and error handling.

Integrate job applied state (so “Apply” button changes to “Applied”).

Add dashboard & notifications for casting directors.

README (Current Implementation + Recommendations)
Implemented Features

Job & Talent Preview

Job cards clickable → show details in modal (JobDetailModal).

Talent grid preview with modals for profiles (TalentsPreview, TalentProfileModal).

ApplyFlowModal

Multi-step modal: confirm profile → upload media → answer question → review → success.

Connected to /api/apply route.

Media uploaded to Cloudinary.

Application saved to MongoDB (Application model).

MongoDB Integration

lib/mongodb.ts handles connection caching.

models/application.ts defines application schema with status.

Apply API

/api/apply POST route.

Accepts jobId, answer, media.

Uploads media to Cloudinary and stores in MongoDB.

Recommended Changes (Future)

✅ **COMPLETED:**
- Store actual talentId from logged-in user (replaced TEMP_TALENT_ID)
- Add validation for media type & size (MP4, JPEG/PNG with size limits)

**REMAINING:**
- Show real-time "Applied" state on job cards.

Jobs

Link Job cards → ApplyFlowModal modal.

Casting Director

Dashboard to review applications.

Status updates: submitted, shortlisted, rejected.

Notifications via email/in-app.

File structure

Keep lib/ & models/ inside app/ for Next.js 13+ (or web/ depending on your structure).

UI

Animate transitions, improve mobile responsiveness.

Use Framer Motion for smooth step transitions.

---

## 📝 Recent Changes & Updates

### Latest Update (Authentication & Media Validation)

**Date:** Current Session

**Changes Made:**

1. **Authentication Integration**
   - ✅ Replaced `TEMP_TALENT_ID` with authenticated user ID from request cookies
   - ✅ Added `getUserId()` helper function in `/api/apply/route.ts` that reads from cookies
   - ✅ Returns 401 Unauthorized if user is not logged in
   - ✅ Supports multiple cookie name patterns (`userId`, `user_id`, `session`)

2. **Media Validation**
   - ✅ Added server-side validation in API route:
     - File types: MP4 videos, JPEG/PNG images only
     - Size limits: 50MB for videos, 10MB for images
     - Returns descriptive error messages
   - ✅ Added client-side validation in `ApplyFlowModal`:
     - Real-time validation on file selection
     - Inline error messages displayed to user
     - File input `accept` attribute restricts file picker
     - Help text showing accepted formats and limits
   - ✅ Cloudinary upload now uses correct `resource_type` (video/image) based on file type

**Files Modified:**
- `web/app/api/apply/route.ts` - Added authentication check and media validation
- `web/app/components/modals/apply-flow-modal.tsx` - Added client-side validation and error handling

**Next Steps & Recommendations:**

1. **Authentication System**
   - Implement full authentication system (NextAuth.js, Clerk, or custom solution)
   - Set up session management and cookie handling
   - Update `getUserId()` to match your chosen auth system's cookie/session structure
   - Consider using authorization headers (Bearer tokens) as alternative to cookies

2. **Enhanced Validation**
   - Add file content validation (not just MIME type) to prevent spoofing
   - Consider adding video duration limits for MP4 files
   - Add image dimension validation (min/max width/height)
   - Implement virus scanning for uploaded files (production)

3. **User Experience**
   - Show file upload progress indicator
   - Display file size and type in review step
   - Add preview for uploaded images/videos before submission
   - Implement "Applied" state on job cards to prevent duplicate applications

4. **Error Handling**
   - Replace `alert()` calls with proper toast notifications
   - Add retry logic for failed uploads
   - Better error messages for network failures
   - Logging for debugging production issues

5. **Security**
   - Add rate limiting to prevent abuse
   - Implement CSRF protection
   - Add file content scanning (malware detection)
   - Validate user permissions (ensure user can only apply as themselves)

6. **Testing**
   - Add unit tests for validation functions
   - Add integration tests for API route
   - Test with various file types and sizes
   - Test authentication flow end-to-end

---

### Update: Duplicate Application Check & Code Documentation

**Date:** Current Session

**Changes Made:**

1. **Fixed Duplicate Application Check**
   - ✅ Fixed bug where duplicate check was using hardcoded `"TEMP_TALENT_ID"` instead of authenticated `talentId`
   - ✅ Now properly prevents users from applying to the same job twice
   - ✅ Returns 400 error with clear message if duplicate application detected

2. **Enhanced Code Documentation**
   - ✅ Added comprehensive JSDoc comment for POST endpoint
   - ✅ Added inline comments explaining each step of the application process
   - ✅ Documented request/response formats
   - ✅ Added comments for database operations, Cloudinary upload, and validation steps

**Files Modified:**
- `web/app/api/apply/route.ts` - Fixed duplicate check bug and added comprehensive comments

**Next Steps & Recommendations:**

1. **Duplicate Application Handling**
   - Consider showing "Already Applied" state in UI before user attempts to apply
   - Add visual indicator on job cards for jobs user has already applied to
   - Consider allowing users to update their existing application instead of blocking

2. **Error Handling**
   - Add more specific error messages for different failure scenarios
   - Log duplicate application attempts for analytics
   - Consider rate limiting per user to prevent spam

3. **Testing**
   - Add test case for duplicate application prevention
   - Test with multiple users applying to same job
   - Verify error messages are user-friendly

---

### Update: Applied Status Feature & UI Feedback

**Date:** Current Session

**Changes Made:**

1. **New API Route: Applied Status Check**
   - ✅ Created `/api/apply/status/route.ts` - GET endpoint to check if user has applied to a job
   - ✅ Uses authenticated user ID from cookies (same pattern as apply route)
   - ✅ Returns `{ applied: boolean }` response
   - ✅ Handles missing jobId and unauthenticated users gracefully

2. **Job Detail Modal Updates**
   - ✅ Added `hasApplied` state to track application status
   - ✅ Fetches applied status on modal open using `useEffect`
   - ✅ Button shows "Applied" state when user has already applied
   - ✅ Button is disabled when already applied or while checking status
   - ✅ Refreshes status after ApplyFlowModal closes (in case application was successful)

3. **Jobs Preview Component Updates**
   - ✅ Added unique IDs to all job objects
   - ✅ Added `appliedJobs` state to track which jobs user has applied to
   - ✅ Checks applied status for all jobs on component mount
   - ✅ Displays "Applied" badge on job cards for applied jobs
   - ✅ Refreshes applied status when job detail modal closes

**Files Created:**
- `web/app/api/apply/status/route.ts` - New API route for checking applied status

**Files Modified:**
- `web/app/components/job-detail-modal.tsx` - Added applied status check and UI feedback
- `web/app/components/jobs-preview.tsx` - Added applied badges and status tracking

**Next Steps & Recommendations:**

1. **Performance Optimization**
   - Consider batching status checks in a single API call instead of multiple requests
   - Add caching for applied status to reduce database queries
   - Implement optimistic UI updates when user applies

2. **User Experience**
   - Add loading skeleton while checking applied status
   - Show toast notification when application is successfully submitted
   - Consider allowing users to view/edit their submitted application
   - Add "View Application" button for applied jobs instead of just disabling

3. **Data Management**
   - Add timestamps to Application model to track when applications were submitted
   - Consider adding application status (submitted, reviewed, shortlisted, rejected)
   - Add ability to track multiple application attempts (if allowed)

4. **Testing**
   - Test applied status check with authenticated and unauthenticated users
   - Test status refresh after successful application
   - Test with multiple jobs and verify badges appear correctly
   - Test edge cases (network errors, API failures)

5. **Future Enhancements**
   - Add "My Applications" page/dashboard
   - Show application history and status updates
   - Allow users to withdraw applications
   - Add notifications when application status changes

---

**Note:** This section will be updated with each change made to the application. Always document what was changed, why it was changed, and what the next logical steps should be.