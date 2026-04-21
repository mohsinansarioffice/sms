# PROJECT_CONTEXT — School Management System

Single reference for AI assistants and developers. **Update this file** after meaningful changes: adjust affected sections and append the [Change Log](#8-change-log-auto-updated-section).

**Scope note:** All first-party code under `backend/src` and `frontend/src` was reviewed (82 source files). `node_modules`, `frontend/dist`, and Vite template files (`frontend/src/main.ts`, `counter.ts`, default `style.css` / `public` demo assets) were not treated as product code unless noted.

---

## 1. Project Overview

### Purpose & users
- **Purpose:** Multi-tenant school administration: students, teachers, attendance, academic structure (years / classes / sections / subjects), exams and results, fee categories/structures/assignments/payments/reports, and subscription/usage for the owning school.
- **Target users:** School **admins** (full CRUD on most resources, fee reports, plan changes) and **teachers** (read students/teachers, mark attendance, create/edit exams and enter marks per route rules).
- **Value proposition:** One school per registration (`School` + admin `User`), data scoped by `schoolId`, JWT auth, plan-based limits (student/teacher counts) and feature flags (defined in code; enforcement partially wired — see [§7](#7-current-state--known-issues)).

### Tech stack (authoritative from `package.json`)
| Area | Stack |
|------|--------|
| **Backend** | Node.js, **Express** `^5.2.1`, **Mongoose** `^9.3.3`, **MongoDB**, **JWT** (`jsonwebtoken`), **bcryptjs**, **express-validator**, **cors**, **dotenv** |
| **Backend dev** | **nodemon** `^3.1.14` |
| **Frontend** | **React** `^19.2.4`, **React DOM** `^19.2.4`, **Vite** `^8.0.4`, **@vitejs/plugin-react** `^6.0.1` |
| **Frontend UI/data** | **Tailwind CSS** `^3.4.17`, **react-router-dom** `^6.30.3`, **axios** `^1.14.0`, **zustand** `^5.0.12` (+ `persist` for auth), **react-hook-form** `^7.72.1`, **react-hot-toast** `^2.6.0`, **lucide-react**, **@tanstack/react-table** `^8.21.3`, **date-fns** `^4.1.0`, **recharts** `^3.8.1` |
| **Frontend TS tooling** | **TypeScript** `~6.0.2` in devDependencies (project entry is **JSX** via `main.jsx`; `tsconfig.json` targets `src` but the React app does not use `main.ts` as entry) |

### Architecture pattern
- **Split codebase** (not a formal npm monorepo): `backend/` (Express API) + `frontend/` (Vite SPA). No shared package.
- **Backend:** Classic **MVC-style layering** — `routes/` → `controllers/` → `models/` + `middleware/`, `config/`.
- **Frontend:** **Feature-oriented pages** under `pages/`, **Zustand** stores mirroring domains, shared **components/common**, **React Router** client-side routing, **axios** instance in `lib/axios.js`.

---

## 2. Project Structure

### Top-level layout
```
school-management-system/
├── backend/                 # Express + Mongoose API
│   ├── server.js            # App bootstrap: middleware, mongoose.connect, route mounts, /health
│   ├── package.json
│   ├── .env.example         # Template for backend env vars (names documented in §6)
│   └── src/
│       ├── config/          # db.js (connect helper), plans.js (subscription feature matrix)
│       ├── controllers/     # Route handlers (business logic)
│       ├── middleware/      # auth.js, featureGate.js, errorHandler.js, notFound.js
│       ├── models/          # Mongoose schemas
│       └── routes/          # Express routers (many mounted directly from server.js)
├── frontend/                # Vite + React SPA
│   ├── index.html           # Loads /src/main.jsx
│   ├── vite.config.js       # Dev server port 3000, @vitejs/plugin-react
│   ├── tailwind.config.js, postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx         # React root + Toaster
│       ├── App.jsx          # BrowserRouter + all Route definitions
│       ├── index.css        # Global styles / Tailwind layers
│       ├── lib/axios.js     # API client: baseURL, JWT header, unwraps response.data
│       ├── store/           # Zustand stores (auth, students, teachers, …)
│       ├── pages/           # Screen components by domain
│       └── components/common/  # ProtectedRoute, DataTable, FeatureLock
├── PROJECT_CONTEXT.md       # This file
└── [optional / environment-specific files not listed]
```

### Entry points
| Layer | File | Role |
|--------|------|------|
| Backend | `backend/server.js` | `express()`, `mongoose.connect(process.env.MONGODB_URI)`, mounts `/api/*` routers, inline `/health`, global error + 404 JSON handlers |
| Frontend | `frontend/index.html` → `frontend/src/main.jsx` | `createRoot`, `<App />`, `react-hot-toast` `<Toaster />` |
| Frontend routing | `frontend/src/App.jsx` | All `react-router-dom` routes; `/` → redirect to `/login` |
| Unused Vite TS demo | `frontend/src/main.ts`, `counter.ts` | Default Vite template; **not** wired by `index.html` |

### Notable non-entry / orphan backend pieces
- `backend/src/routes/index.js` — defines `/health` + `/auth` under a sub-router; **not** mounted by `server.js` (auth is mounted as `app.use('/api/auth', …)` directly).
- `backend/src/config/db.js` exports `connectDB`; **not** used — `server.js` calls `mongoose.connect` inline.
- `backend/src/middleware/errorHandler.js` and `notFound.js` — **not** registered in `server.js` (errors use inline handler).

---

## 3. Core Features & Modules

| Feature | Description | Primary frontend | Primary backend |
|--------|-------------|------------------|-------------------|
| **Auth / onboarding** | Register school + admin, login, JWT; `GET /api/auth/me` | `pages/auth/Login.jsx`, `Register.jsx`, `store/authStore.js` | `routes/auth.js`, `controllers/authController.js`, `middleware/auth.js` |
| **Students** | CRUD, pagination, filters, admission number auto (`generateAdmissionNumber`) | `pages/students/*`, `store/studentStore.js` | `routes/student.js`, `controllers/studentController.js`, `models/Student.js` |
| **Teachers** | CRUD, optional `userId` link | `pages/teachers/*`, `store/teacherStore.js` | `routes/teacher.js`, `controllers/teacherController.js`, `models/Teacher.js` |
| **Attendance** | Mark/update by date/class/section; student timeline; report; delete (admin) | `pages/attendance/*`, `store/attendanceStore.js` | `routes/attendance.js`, `controllers/attendanceController.js`, `models/Attendance.js` |
| **Academic settings** | Academic years, classes, sections, subjects | `pages/academic/AcademicSettings.jsx`, `store/academicStore.js` | `routes/academic.js`, `controllers/academicController.js`, models `AcademicYear`, `Class`, `Section`, `Subject` |
| **Exams** | Exam types, exams, results entry, publish, analytics, per-student results | `pages/exams/*`, `store/examStore.js` | `routes/exam.js`, `controllers/examController.js`, models `Exam`, `ExamType`, `ExamResult` |
| **Fees** | Categories, structures, assign, student fee ledger, payments, receipt, collection/defaulter reports | `pages/fees/*`, `store/feeStore.js` | `routes/fee.js`, `controllers/feeController.js`, models `FeeCategory`, `FeeStructure`, `StudentFee`, `FeePayment` |
| **Subscription / usage** | Plans from `config/plans.js`, usage counts, mock plan change | `pages/settings/Plans.jsx`, `Usage.jsx`, `store/subscriptionStore.js`, `Dashboard.jsx` | `routes/subscription.js`, `controllers/subscriptionController.js`, `models/School.js` |
| **Dashboard** | Summary cards, links to modules, usage bars | `pages/Dashboard.jsx` | Aggregates stores + `/subscription/usage` |
| **UI primitives** | Tables, paywall placeholder | `components/common/DataTable.jsx`, `FeatureLock.jsx` | — |

### Key module dependencies
- Almost all resources are scoped by **`req.user.schoolId`** (set in `middleware/auth.js` after JWT decode).
- **Academic** entities feed **Students** (`classId`/`sectionId`), **Attendance** (`classId`/`sectionId`), **Exams** (`academicYearId`, `classId`, `subjectId`, …), **Fees** (`academicYearId`, `classId`, structures).
- **Subscription** data lives on `School`; frontend reads limits/features via **`/api/subscription/usage`** and **`/api/subscription/plans`**.

---

## 4. Data Layer

### Database
- **MongoDB** via Mongoose; connection string from **`MONGODB_URI`**.

### Core collections (models)
- **User** — `email`, `password` (hashed on save), `role` enum `admin|teacher|student`, `schoolId`, `profile.name|phone|address`, `isActive`.
- **School** — `name`, `subscriptionPlan` (`free|basic|premium`), `subscriptionExpiry`, `limits.maxStudents|maxTeachers` (synced in `pre('validate')` from plan), `owner`, `isActive`.
- **Student** — `schoolId`, unique `(schoolId, admissionNumber)`, nested `personalInfo`, `contactInfo`, `guardianInfo`, `academicInfo` (string class/section **and/or** `classId`/`sectionId` refs), `isActive`.
- **Teacher** — `schoolId`, unique `(schoolId, employeeId)`, `userId?`, nested info; **note:** `personalInfo.gender` enum uses **lowercase** (`male|female|other`) unlike Student’s `Male|Female|Other`.
- **Attendance** — unique compound `(schoolId, date, classId, sectionId)`; `records[]` with `studentId`, `status` (`present|absent|late|excused`); static `getStudentAttendancePercentage`.
- **AcademicYear**, **Class**, **Section**, **Subject** — school-scoped; Section has optional `classTeacher` → `Teacher`.
- **ExamType**, **Exam** — exam linked to year, type, class, optional section, subject, marks, `isPublished`; **ExamResult** unique `(examId, studentId)`; grade derived in `pre('save')`.
- **FeeCategory**, **FeeStructure**, **StudentFee**, **FeePayment** — structures tie class + category + academic year; payments update balances; `receiptNumber` generated in `FeePayment` `pre('save')`.

### State management (frontend)
- **Zustand** per domain (`store/*.js`).
- **Auth** uses **`persist`** (`auth-storage`) partializing `user`, `token`, `isAuthenticated`; token is **also** duplicated in **`localStorage`** key `token` for the axios interceptor.

### API structure
- **REST**, JSON bodies, prefix **`/api`** (axios `baseURL` should include `/api` or callers use paths like `/auth/login` relative to that base — see `frontend/src/lib/axios.js`).
- **Auth header:** `Authorization: Bearer <token>` (from `localStorage` in axios interceptor).

#### Mounted routes (`backend/server.js`)
| Mount path | Router file |
|------------|-------------|
| `/api/auth` | `src/routes/auth.js` |
| `/api/students` | `src/routes/student.js` |
| `/api/teachers` | `src/routes/teacher.js` |
| `/api/attendance` | `src/routes/attendance.js` |
| `/api/subscription` | `src/routes/subscription.js` |
| `/api/academic` | `src/routes/academic.js` |
| `/api/exams` | `src/routes/exam.js` |
| `/api/fees` | `src/routes/fee.js` |

**Representative endpoints** (see router files for full list and HTTP verbs):
- Auth: `POST /register`, `POST /login`, `GET /me`
- Students: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- Teachers: same pattern
- Attendance: `POST /`, `GET /`, `PUT /:id`, `GET /student/:studentId`, `GET /report`, `DELETE /:id`
- Subscription: `GET /plans`, `GET /usage`, `POST /change-plan`
- Academic: `GET|POST|PUT|DELETE` under `/years`, `/classes`, `/sections`, `/subjects`
- Exams: `/types`, `/`, `/:id`, `/:examId/results`, `/:examId/publish`, `/:examId/analytics`, `/student/:studentId/results`
- Fees: `/categories`, `/structures`, `/assign`, `/student/:studentId`, `/students`, `/student-fee/:id`, `/payments`, `/payments/student/:studentId`, `/payments/:id/receipt`, `/reports/collection`, `/reports/defaulters`

### External services & integrations
- **None** in code (no payment provider, SMS, or cloud storage). Plan changes are **mock** (`subscriptionController.changePlan`).

---

## 5. Key Conventions & Patterns

### Naming
- **Files:** `camelCase` for JS (`studentController.js`), **PascalCase** for React components (`StudentList.jsx`).
- **API JSON:** frequent envelope `{ success, message?, data? }` from controllers; axios instance returns **`response.data`** from Axios, so frontend often uses `response.data` where `response` is already the unwrapped API body.

### Backend patterns
- **Controllers** export async functions; **routes** attach `express-validator` chains and `protect` / `authorize('admin'|'teacher')`.
- **Role rules:** e.g. students list `admin|teacher`; create/update/delete students `admin` only (see `student.js`).
- **School guard:** `studentController.requireSchoolId` pattern for `req.user.schoolId`.

### Frontend patterns
- **Pages** colocated by domain under `pages/<domain>/`.
- **Stores** call axios with paths like `'/students'` (relative to `baseURL`).
- **Forms:** `react-hook-form` on auth pages; other pages mix controlled inputs / custom logic **[implementation varies per page]**.
- **Tables / lists:** `@tanstack/react-table` via `DataTable.jsx` where used.

### Routing
- **`BrowserRouter`** in `App.jsx`; protected routes wrap children in **`ProtectedRoute`** (checks `useAuthStore().isAuthenticated`).
- **No role-based route splits** at router level — unauthorized users get **403** from API if they hit a forbidden action.

### Authentication & authorization
- **JWT** payload includes `id`, `role`, `schoolId` (`authController.generateToken`).
- **`protect`:** validates Bearer token, loads `User` onto `req.user`.
- **`authorize(...roles)`:** role whitelist per route.
- **401 handling in axios:** clears `token` and `user` from `localStorage` but does not itself redirect; navigation relies on store/`ProtectedRoute`.

---

## 6. Environment & Configuration

### Environment variables (names only)
**Backend** (`backend/.env.example`):
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`

**Frontend** (consumed in code):
- `VITE_API_URL` — optional; defaults in `lib/axios.js` to `http://localhost:5000/api`

### Build & run commands
**Backend** (`backend/package.json`):
- `npm run dev` — `nodemon server.js`
- `npm start` — `node server.js`

**Frontend** (`frontend/package.json`):
- `npm run dev` — `vite` (port **3000** per `vite.config.js`)
- `npm run build` — `vite build`
- `npm run preview` — `vite preview`

### Deployment
- No Dockerfile, CI config, or platform manifests were found in the reviewed tree **[NEEDS CLARIFICATION]** if deployment is elsewhere.
- `frontend/dist/` exists as a build artifact; treat as generated output.

---

## 7. Current State & Known Issues

### Implemented (functional surface)
- Full-stack flows for auth, students, teachers, attendance, academic CRUD, exams (including results/publish/analytics paths in routers), fees (categories through reports), subscription plans/usage/change, dashboard navigation.

### Partial / inconsistent
- **`backend/src/middleware/featureGate.js`** (`checkFeature`, `checkLimit`) is **never imported** into route files — plan **features** and limits in `plans.js` are **not** enforced on API routes (only subscription **UI** and school limits embedded in `School` / `changePlan` downgrade checks).
- **`FeatureLock.jsx`** is a **static** paywall UI (does not read live plan flags from the store unless wired per page) **[verify per page before assuming enforcement]**.
- **`backend/src/routes/index.js`**, **`config/db.js`**, **`errorHandler.js`**, **`notFound.js`** — unused by current `server.js`.

### Bugs / tech debt (from code review)
- **Student text search:** `studentController.getStudents` uses `filter.$text` when `search` is set, but **`Student` schema has no `$text` index** (only a comment). Searches with `search` query may **error at runtime** until a text index or alternate query is added.
- **Teacher vs student gender enums** differ (case and values) — risk of validation mismatches if UI sends Student-style values.
- **`authStore.fetchUser`:** catch references `error.response` but the axios wrapper rejects with a plain **`Error`**, so that branch may not behave as intended.
- **Vite leftovers:** `main.ts` / `counter.ts` / template `public` assets add noise; not part of the React app.

### TODO comments
- **None** in `backend/src` or `frontend/src` (grep for `TODO` / `FIXME` / `HACK`).

---

## 8. Change Log (Auto-Updated Section)

Maintain this list in reverse chronological order when making changes.

| Date | Type | Description |
|------|------|-------------|
| 2026-04-18 | **UI** | Aligned fee pages (`StudentFeeDetail`, `PaymentReceipt`, `FeeReports`, `StudentFeeList`) with app patterns: `btn-primary`/`btn-secondary`, `input-field`, `card`, primary palette, `font-bold`/`font-medium` typography; removed indigo/purple-heavy styling and placeholder receipt footer. |
| 2026-04-18 | **Refactor** | Removed debug instrumentation: ingest `fetch` calls from `frontend/src/store/feeStore.js` and file logging helper from `backend/src/controllers/feeController.js` (`assignFees`). |
| 2026-04-18 | **Fix** | `StudentFee` / `FeePayment` Mongoose hooks: removed legacy `next()` from `pre('save')` / `pre('validate')` (Mongoose 9 → `TypeError: next is not a function` on `StudentFee.create` during fee assign). |
| 2026-04-18 | **Fix** | `assignFees` (`feeController.js`): normalize `schoolId` / class / year / student ids to `ObjectId`, validate active students belong to school, coerce `totalAmount`, return 400 on validation/cast/duplicate key. |
| 2026-04-18 | **Fix** | Fee module: corrected `feeStore` API payload paths (axios returns `{ success, data }` once); `getAllStudentFees` now filters `classId` in DB before pagination; stricter `recordPayment` / `updateStudentFee`; `FeePayment` receipt generation moved to `pre('validate')` using document `_id`; collection report date range end-of-day; fee store errors use `error.message` (axios interceptor). |
| 2026-04-18 | **Docs** | Added `PROJECT_CONTEXT.md` as the project knowledge base. |

---

*End of document.*
