# Chatflow

Chatflow is an IRC-style team chat application with a Quasar frontend and an AdonisJS backend. The demo workspace is called Northwind.

Authentication, the channel list (create, join, leave, delete, invitations, 30-day inactivity cleanup), channel commands (`/join`, `/invite`, `/revoke`, `/kick` with vote bans, `/quit`, `/cancel`, `/list`), and messages (send, history, unread counts, live delivery) are served by the backend. Invitations, removals, and member-list changes reach other users live. Typing activity and member presence are still simulated in the frontend.

## Stack and libraries

- Vue and TypeScript
- AdonisJS, Lucid ORM, VineJS validation, access-token auth, rate limiting, and Transmit (server-sent events) for live messages (`backend`)
- PostgreSQL
- Quasar for UI components, dialogs, and notifications
- Pinia for state management
- Vue Router for navigation
- Vite through the Quasar CLI for development and builds
- SCSS for styling and Material Icons from `@quasar/extras`
- ESLint, Prettier, and vue-tsc for code checks

## Main features

- Registration and login with a nickname or email
- Public and private channels, with options to create, join, leave, and delete channels
- Channel invitations, invitation revocation, and votes to remove members
- Channel messages, mention highlighting, and unread counts
- Simulated typing indicators with a draft preview
- Presence settings and browser notifications for all messages or mentions
- Slash commands: `/join`, `/invite`, `/revoke`, `/kick`, `/quit`, `/cancel`, and `/list`

## Run locally

Backend (needs a running PostgreSQL server):

```bash
cd backend
npm ci
cp .env.example .env
```

Set `APP_KEY` (`node ace generate:key`) and the `DB_*` values in `backend/.env`, create the database named in `DB_DATABASE`, then:

```bash
node ace migration:run
node ace db:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

The frontend talks to `http://localhost:3333/api/v1` by default; override it with the `API_URL` environment variable when building. The backend accepts requests from the origins listed in `CORS_ORIGIN`.

Seeded login: `johndoe` / `chatflow123`. `#general` is seeded with 200 messages to demonstrate the infinite scroll of the message history.

## Build and checks

Run these commands from `frontend`:

```bash
npm run build
npm run typecheck
npm run lint:check
```

Use `npm run lint` to format files and apply lint fixes.

Backend checks, run from `backend`. Tests use the `chatflow` database from `backend/.env`: they empty its tables and roll back all migrations when they finish, so run `node ace migration:run` and `node ace db:seed` afterwards to restore the demo data.

```bash
npm run typecheck
npm run lint
npm test
```
