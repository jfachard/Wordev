# Wordev 🟩🟨⬛

> A Wordle-inspired game for developers. Guess tech-related words in Solo, Daily, or real-time Versus mode.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=flat&logo=vuedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=flat&logo=pinia&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

---

## What is Wordev?

Wordev is a full-stack word game built around the developer world. Like Wordle, you guess a hidden word in 6 attempts — but every word comes from the dev universe: languages, frameworks, tools, concepts.

Three game modes:

- **Solo** — Play anytime, unlimited games, at your own pace
- **Daily** — One shared word per day, everyone plays the same challenge
- **Versus** — Real-time 1v1 matchmaking with ELO ranking and live feedback via WebSockets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue.js 3, TypeScript, Vite, Pinia |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Features

### Solo Mode
- Start a new game at any time
- 6 attempts to guess the hidden tech word
- Letter feedback: correct position 🟩, wrong position 🟨, not in word ⬛
- Game history and personal stats

### Daily Mode
- One word per day, shared across all players
- Nightly cron job selects the daily word automatically
- Come back every day for a new challenge

### Versus Mode
- Real-time 1v1 matchmaking queue
- Both players guess the same word simultaneously
- Live opponent progress visible during the game
- ELO-based ranking system
- Handles disconnections gracefully

### Leaderboard
- Global leaderboard ranked by ELO
- Per-user stats: games played, win rate, average attempts, ELO history

---

## Project Structure

```
wordev/
├── client/          # Vue.js 3 frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── views/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/      # Pinia stores
│   │   └── socket/
├── wordev-api/          # NestJS backend
│   ├── src/
│   │   ├── auth/
│   │   ├── games/
│   │   ├── users/
│   │   ├── words/
│   │   ├── leaderboard/
│   │   └── gateway/     # Socket.io gateway
│   └── prisma/
│       └── schema.prisma
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/jfachard/wordev.git
cd wordev
```

**Backend:**
```bash
cd wordev-api
npm install
cp .env.example .env   # Fill in your DATABASE_URL and JWT secrets
npx prisma migrate dev
npx prisma db seed     # Seeds the words table with tech vocabulary
npm run start:dev
```

**Frontend:**
```bash
cd client
npm install
cp .env.example .env   # Set VITE_API_URL
npm run dev
```

---

## Environment Variables

**Server (`wordev-api/.env`)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/wordev
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
```

**Client (`client/.env`)**
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## Roadmap

- [x] Project setup — NestJS + Prisma + PostgreSQL
- [x] Auth — Register, Login, JWT guard
- [ ] Solo mode — Backend + UI
- [ ] Daily mode — Cron job + UI
- [ ] Versus mode — Socket.io gateway + matchmaking + ELO
- [ ] Leaderboard — Global ranking + user stats
- [ ] Deployment — Railway + Vercel

---

## Author

**Jean-Francis Achard**
[Portfolio](https://www.jfachard.com/) · [GitHub](https://github.com/jfachard)
