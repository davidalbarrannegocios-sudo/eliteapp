# Elite App

A private community platform that blends the best of Skool and Discord. Built with Next.js 14, Tailwind CSS, shadcn/ui, Prisma ORM, and NextAuth.js v5.

## Features

- **Communities** — Teachers create invite-only communities with custom colors and branding
- **Discord-style Chat** — Text channels with threads, replies, and pinned messages
- **Skool-style Courses** — Modules, lessons with video embeds, and progress tracking
- **Wins Feed** — Members share achievements with emoji reactions and comments
- **Role System** — STUDENT and TEACHER roles, with teacher code protection
- **Google OAuth + Credentials** — Flexible auth with role selection on first login

## Prerequisites

- Node.js 18+
- npm 9+

> SQLite is used by default (no external database needed).  
> For PostgreSQL, swap the `DATABASE_URL` and update `schema.prisma` provider to `postgresql`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"          # run: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
TEACHER_INVITE_CODE="1234"
```

> Google OAuth is optional for local dev — credentials login works without it.

### 3. Initialize the database

```bash
npx prisma migrate dev
```

### 4. Seed demo data

```bash
npm run seed
```

This creates:

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Teacher | teacher@elite.app    | teacher123  |
| Student | student1@elite.app   | student123  |
| Student | student2@elite.app   | student123  |

Includes: 1 community ("Web Dev Bootcamp"), 1 course (3 lessons across 2 modules), sample channel messages, and a demo win post.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── auth/login/             → Login page
├── auth/register/          → Register (role selection + teacher code)
├── auth/role-select/       → Role selection after Google OAuth
├── dashboard/              → Community list + join via invite code
├── community/[id]/
│   ├── announcements/      → Teacher-only announcements channel
│   ├── channels/           → Text channels list
│   ├── channels/[channelId]/ → Channel chat with threading
│   ├── courses/            → Course grid with progress
│   ├── courses/[courseId]/ → Course detail with module tree
│   ├── courses/[courseId]/lessons/[lessonId]/ → Lesson viewer
│   ├── wins/               → Wins/results feed
│   ├── members/            → Member list (teacher can remove)
│   └── settings/           → Community settings (teacher only)
├── join/[inviteCode]/      → Join via invite link
└── profile/                → User profile & password change

api/
├── auth/register           → Create account
├── auth/set-role           → Set role after Google OAuth
├── communities             → Create / list communities
├── communities/[id]        → Get / update / delete community
├── communities/[id]/channels → List / create channels
├── communities/[id]/courses  → List / create courses
├── communities/[id]/members  → List / remove members
├── communities/[id]/wins     → List / create wins
├── channels/[id]/messages    → List / send messages
├── channels/[id]/messages/[msgId] → Pin / delete message
├── courses/[id]            → Course detail with modules
├── courses/[id]/modules    → Create module
├── modules/[id]/lessons    → Create lesson
├── lessons/[id]/complete   → Mark lesson complete / incomplete
├── wins/[id]/react         → Toggle emoji reaction
├── wins/[id]/comments      → List / post comments
└── join/[code]             → Join community via invite code
```

## Available Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start development server             |
| `npm run build`   | Build for production                 |
| `npm run start`   | Start production server              |
| `npm run seed`    | Seed demo data into the database     |
| `npm run lint`    | Run ESLint                           |

## Tech Stack

| Layer       | Tech                                  |
|-------------|---------------------------------------|
| Framework   | Next.js 14 (App Router)               |
| Styling     | Tailwind CSS + shadcn/ui              |
| Animations  | Framer Motion                         |
| Auth        | NextAuth.js v5 (JWT + Prisma Adapter) |
| Database    | SQLite via Prisma + LibSQL adapter    |
| Forms       | React Hook Form + Zod v4              |
| Toasts      | Sonner                                |

## Teacher Code

The default teacher registration code is `1234` (set via `TEACHER_INVITE_CODE` in `.env`). Change it before deploying to production.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable Google+ API
3. Credentials → OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret into `.env`
