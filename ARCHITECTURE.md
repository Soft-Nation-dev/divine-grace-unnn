# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR USERS                               │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ HTTP/HTTPS
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                        │
│                  localhost:5173 (development)                   │
│                                                                  │
│  - User Interface                                               │
│  - Form Submissions                                             │
│  - Session Management                                           │
│  - Local Storage (tokens)                                       │
│                                                                  │
│  src/config/api.js ────────────> Centralized API endpoints    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ REST API Calls (JSON)
               │ Authorization: Bearer {JWT}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│                  localhost:3001 (development)                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                        │   │
│  │ - CORS                                                  │   │
│  │ - Authentication (JWT verification)                    │   │
│  │ - Authorization (Admin checks)                         │   │
│  │ - Body parsing                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Routes                                                  │   │
│  │ - /api/auth        (login, signup, profile)           │   │
│  │ - /api/prayers     (prayer requests)                  │   │
│  │ - /api/lsts        (LSTS registrations)               │   │
│  │ - /api/summit      (summit registrations)             │   │
│  │ - /api/messages    (audio uploads)                    │   │
│  │ - /api/admin       (admin operations)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────┬──────────────────────┬──────────────────────────┘
               │                      │
               │ PostgreSQL           │ File Upload
               │ Queries              │ S3-compatible
               ▼                      ▼
        ┌────────────────┐   ┌─────────────────────┐
        │  SUPABASE      │   │  CLOUDFLARE R2      │
        │                │   │                     │
        │ ┌────────────┐ │   │ ┌─────────────────┐ │
        │ │ PostgreSQL │ │   │ │  Object Storage │ │
        │ │ Database   │ │   │ │  (Audio Files)  │ │
        │ └────────────┘ │   │ └─────────────────┘ │
        │                │   │                     │
        │ ┌────────────┐ │   │ ┌─────────────────┐ │
        │ │ Auth       │ │   │ │  Public URLs    │ │
        │ │ (JWT)      │ │   │ │  for Downloads  │ │
        │ └────────────┘ │   │ └─────────────────┘ │
        │                │   │                     │
        │ ┌────────────┐ │   │ ┌─────────────────┐ │
        │ │ Tables     │ │   │ │  Automatic CDN  │ │
        │ │ - users    │ │   │ │  Distribution   │ │
        │ │ - prayers  │ │   │ └─────────────────┘ │
        │ │ - lsts     │ │   │                     │
        │ │ - summit   │ │   └─────────────────────┘
        │ │ - messages │ │
        │ │ - admins   │ │
        │ └────────────┘ │
        │                │
        │ RLS Policies   │
        │ (Row-level     │
        │  security)     │
        │                │
        │ Functions &    │
        │ Triggers       │
        │                │
        └────────────────┘
```

## Data Flow Example: LSTS Registration

```
User fills form
    ↓
Click "Submit"
    ↓
React Component (registerforlsts.jsx)
    ↓
fetchWithAuth(API_ENDPOINTS.POST_LSTS, {
  method: "POST",
  body: formData
})
    ↓
Frontend sends HTTP POST to backend
Authorization: Bearer {JWT_TOKEN}
    ↓
Backend receives request
    ↓
authMiddleware:
  - Extracts token from Authorization header
  - Verifies token with Supabase
  - Attaches user info to request
    ↓
Route handler (POST /api/lsts):
  - Validates form data
  - Inserts record into lsts_forms table
  - Updates user profile
    ↓
Supabase Database:
  - Inserts into lsts_forms table
  - RLS automatically filters by user_id
  - Triggers update updated_at timestamp
    ↓
Backend returns success response:
{
  "message": "✅ LSTS registration submitted",
  "registration": { id, user_id, ... }
}
    ↓
Frontend receives response
    ↓
User sees confirmation message
    ↓
Form generates QR code/PDF receipt
    ↓
User downloads receipt
```

## File Upload Flow: Audio Messages

```
Admin selects audio file
    ↓
Frontend submits FormData to /api/messages/upload
    ↓
Backend receives FormData
    ↓
adminMiddleware:
  - Verifies user is admin
    ↓
Route handler:
  - Reads file from memory buffer
  - Generates unique filename
  - Calls uploadToR2()
    ↓
Cloudflare R2:
  - Receives file via S3-compatible API
  - Stores in object storage
  - Returns public URL
    ↓
Backend saves metadata to Supabase:
  - file_name
  - file_url
  - file_size
  - uploaded_by
  - timestamp
    ↓
Database inserts audio_messages record
    ↓
Response to frontend:
{
  "message": "✅ Upload successful",
  "message": { id, title, file_url, ... }
}
    ↓
Frontend displays success
    ↓
Audio now available for download at file_url
```

## Authentication Flow

```
USER SIGNUP:
  User enters email/password
      ↓
  POST /api/auth/signup
      ↓
  Backend calls supabase.auth.signUp()
      ↓
  Supabase Auth creates:
    - Auth account
    - JWT tokens (access + refresh)
      ↓
  Backend creates user profile
      ↓
  Response includes tokens
      ↓
  Frontend stores token in sessionStorage

USER LOGIN:
  User enters email/password
      ↓
  POST /api/auth/login
      ↓
  Backend calls supabase.auth.signInWithPassword()
      ↓
  Supabase returns JWT tokens
      ↓
  Backend returns tokens to frontend
      ↓
  Frontend stores in sessionStorage

SUBSEQUENT REQUESTS:
  Frontend adds to every request:
  Authorization: Bearer {access_token}
      ↓
  Backend authMiddleware:
    - Extracts token
    - Calls supabase.auth.getUser(token)
    - Verifies token is valid
    - Extracts user info
      ↓
  Request proceeds if authenticated
      ↓
  If token expired:
    - Frontend sends refresh_token to /api/auth/refresh
    - Gets new access_token
    - Retries original request
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (auth.users)                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ id (UUID) ─────────────────┐                               │ │
│ │ email (TEXT)               │                               │ │
│ │ created_at                 │                               │ │
│ │ ... (managed by Supabase)  │                               │ │
│ └────────────────────────────┼───────────────────────────────┘ │
└──────────────────────────────┼────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
        ┌───────────▼──────────┐  ┌──────▼──────────────────────┐
        │  USER PROFILES       │  │  ADMIN ASSIGNMENTS          │
        │  ┌────────────────┐  │  │  ┌──────────────────────┐   │
        │  │ id (FK→users)  │  │  │  │ id (UUID)            │   │
        │  │ email          │  │  │  │ user_id (FK→users)   │   │
        │  │ full_name      │  │  │  │ assigned_by (FK)     │   │
        │  │ phone          │  │  │  │ role                 │   │
        │  │ is_student     │  │  │  │ assigned_at          │   │
        │  │ level          │  │  │  └──────────────────────┘   │
        │  │ ... (profile)  │  │  │                              │
        │  └────────────────┘  │  └──────────────────────────────┘
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────────────────┐
        │                                  │
┌───────▼──────────────────┐  ┌──────────▼────────────────┐
│  PRAYER REQUESTS         │  │  LSTS FORMS               │
│  ┌────────────────────┐  │  │  ┌──────────────────────┐ │
│  │ id (UUID)          │  │  │  │ id (UUID)            │ │
│  │ user_id (FK)   ────┼──┼──┼──│ user_id (FK)     ──┐ │ │
│  │ name               │  │  │  │ surname              │ │ │
│  │ email              │  │  │  │ departments (Array)  │ │ │
│  │ prayer_request     │  │  │  │ is_student           │ │ │
│  │ submitted_at       │  │  │  │ submitted_at         │ │ │
│  └────────────────────┘  │  │  └──────────────────────┘ │ │
│                          │  └────────────────────────────┘ │
│         (Similar         │                                │
│         for SUMMIT       │         (Similar for           │
│         FORMS)           │          AUDIO_MESSAGES)       │
└──────────────────────────┘────────────────────────────────┘
```

## Security Model

```
┌────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                     │
│  - JWT tokens from Supabase Auth                          │
│  - Verified on every request                              │
│  - Expired tokens refreshable                             │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION LAYER                       │
│  - Admin middleware checks admin_assignments table        │
│  - Regular users can only access own data                │
│  - Admins can access all data                            │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   ROW-LEVEL SECURITY (RLS)                │
│  - Enforced at database level                            │
│  - Supabase policies filter rows automatically           │
│  - Even admins see correct rows                          │
│  - Cannot be bypassed from frontend                      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 DATA ENCRYPTION IN TRANSIT                │
│  - HTTPS/TLS for all communication                       │
│  - Cloudflare CDN handles SSL/TLS                        │
│  - Tokens in Authorization header only                   │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
                        GitHub Repository
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Your Git Commits       │
                    │  (Frontend + Backend)   │
                    └────────────┬────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
                  ▼                             ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Render/Railway  │      │  Vercel/Netlify │
        │  (Backend)       │      │  (Frontend)      │
        │                  │      │                  │
        │ - Node.js        │      │ - React/Vite    │
        │ - Environment    │      │ - Environment   │
        │   variables      │      │   variables     │
        │ - Automatic      │      │ - Automatic    │
        │   deploys        │      │   deploys       │
        │                  │      │                 │
        │ https://your-app │      │ https://your-   │
        │ -backend.        │      │ frontend.app    │
        │ onrender.com     │      │                 │
        └────────┬─────────┘      └────────┬────────┘
                 │                         │
                 │                         │
                 ▼                         ▼
        ┌─────────────────────────────────────────┐
        │  Your Domain (DNS routing)              │
        │  - api.yourdomain.com → Backend        │
        │  - yourdomain.com → Frontend           │
        └─────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
  Supabase                Cloudflare R2
  (Database)             (File Storage)
  (Auth)                 (CDN)
```

---

This architecture provides:

- ✅ Scalability (microservices approach)
- ✅ Security (authentication, authorization, encryption)
- ✅ Reliability (managed services, CDN)
- ✅ Cost-effectiveness (free tiers available)
- ✅ Easy maintenance (separate concerns)
