# StudyQuest 🎮

Gamified study app with real-time multiplayer challenges.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Realtime**: Socket.io (Node.js server)
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Rooms**: Redis (Upstash)
- **AI**: Google Gemini 1.5 Flash (free)
- **Auth**: NextAuth.js + Facebook OAuth
- **Storage**: Cloudflare R2
- **Deploy**: Vercel (web) + Railway (socket server)

## Getting Started

### 1. Clone and install
```bash
git clone <your-repo>
cd studyquest
npm install
```

### 2. Set up environment variables
```bash
cp apps/web/.env.example         apps/web/.env.local
cp apps/socket-server/.env.example  apps/socket-server/.env
```
Fill in all values (see setup guide below).

### 3. Set up database
```bash
cd apps/web
npx prisma db push
npx prisma generate
```

### 4. Run locally
```bash
# From root
npm run dev   # starts both Next.js (3000) and socket server (4000)
```

## Environment Setup Guide

### Supabase (PostgreSQL) — free
1. Go to https://supabase.com → New project
2. Settings → Database → copy Connection String
3. Paste as DATABASE_URL

### Facebook OAuth
1. https://developers.facebook.com → Create App → Consumer
2. Add Facebook Login product
3. Copy App ID and App Secret
4. Add `http://localhost:3000/api/auth/callback/facebook` to Valid OAuth Redirect URIs

### Google Gemini — free
1. https://aistudio.google.com → Get API key
2. Paste as GEMINI_API_KEY

### Cloudflare R2
1. Cloudflare dashboard → R2 → Create bucket named `studyquest-files`
2. Manage R2 API tokens → Create token
3. Fill R2_* env vars

### Upstash Redis — free
1. https://upstash.com → Create database
2. Copy UPSTASH_REDIS_REST_URL and TOKEN

## Deployment

### Vercel (Next.js web app)
```bash
npm i -g vercel
cd apps/web
vercel --prod
```
Add all env vars in Vercel project settings.

### Railway (Socket.io server)
1. https://railway.app → New project → Deploy from GitHub
2. Point to `apps/socket-server`
3. Add env vars: PORT, CLIENT_URL, REDIS_URL, NEXTAUTH_SECRET
4. Copy the Railway URL → set as NEXT_PUBLIC_SOCKET_URL in Vercel

## Project Structure
```
studyquest/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── app/                # App Router pages + API routes
│   │   │   ├── (auth)/         # Login page
│   │   │   ├── (app)/          # Dashboard, topic, game pages
│   │   │   └── api/            # REST endpoints
│   │   ├── components/
│   │   │   ├── ui/             # Buttons, cards, modals
│   │   │   ├── game/           # FlashCard, Timer, HandRaise, Scoreboard
│   │   │   ├── topic/          # TopicCard, UploadForm, ModeSelector
│   │   │   ├── social/         # FriendList, Leaderboard, ChallengeInvite
│   │   │   └── layout/         # Navbar, Sidebar
│   │   ├── lib/
│   │   │   ├── ai/             # Gemini card generation
│   │   │   ├── auth/           # NextAuth config
│   │   │   ├── db/             # Prisma client
│   │   │   └── storage/        # R2 upload helpers
│   │   ├── hooks/
│   │   │   └── useSocket.ts    # Socket.io client hook
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   └── socket-server/          # Realtime Node.js server
│       └── src/
│           ├── rooms/          # Room state + Redis store
│           ├── events/         # Game logic (hand-raise, answers)
│           └── middleware/     # JWT auth
└── packages/
    └── shared/                 # Types, constants, EXP formula
        └── src/index.ts
```
