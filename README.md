# Chatflow

Chatflow is an IRC-style team chat frontend. The demo workspace is called Northwind.

The app uses in-memory mock services for accounts, channels, and messages. Incoming messages and typing activity are simulated.

## Stack and libraries

- Vue and TypeScript
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

```bash
cd frontend
npm ci
npm run dev
```

Demo login: `johndoe` / `chatflow123`.

## Build and checks

Run these commands from `frontend`:

```bash
npm run build
npm run typecheck
npm run lint:check
```

Use `npm run lint` to format files and apply lint fixes.
