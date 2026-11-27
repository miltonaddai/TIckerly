# Tickerly

Stock screener with custom screens, live alerts, and a shader-backed UI.

This is a Yarn workspaces monorepo:

```
.
├── package.json     # root scripts + workspaces
├── yarn.lock        # single lockfile for all packages
├── backend/         # @tickerly/api  — Node + Hono API and alert worker
└── frontend/        # @tickerly/web  — React + Vite app
```

## Quick start

Requires Node 20+ and Yarn 1.x.

```bash
yarn install   # once, from the repo root
yarn dev       # API (3001) + web (5173) + alert worker
```

Open http://localhost:5173. Every page (`/home`, `/screener`, `/alerts`, `/profile`) opens directly with no login. Requests without a session act as a shared demo user. You can register or log in (`demo@tickerly.app` / `tickerly123`) to get a separate account.

The app has no external services and no API keys:

| Feature | Implementation |
| --- | --- |
| Accounts, profile, watchlist, alerts | In-memory store (reset on API restart) |
| Market data | Generated quotes for ~80 symbols that drift every 5 minutes. **Not real prices.** |
| AI assistant | Rule-based summary of the current quotes |
| Plans | Choosing a plan updates the profile; nothing is gated |
| Rate limits / alert worker | In-process |
| Fonts | Bundled via `@fontsource` |

## Scripts (run from the root)

| Command | What it does |
| --- | --- |
| `yarn dev` | API + web + worker with hot reload |
| `yarn dev:api` / `yarn dev:web` / `yarn worker` | Run one piece |
| `yarn build` | Type-check the API and build the web app |
| `yarn start` | Run the API and preview the built web app |
| `yarn test` | Backend and frontend test suites |

App: http://localhost:5173 · API health: http://localhost:3001/api/health

## Configuration

`backend/.env.example` lists the only settings: `PORT`, `APP_ORIGIN`, and `SESSION_SECRET`. All three have defaults, so a `.env` file is optional.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, shadcn-style UI, Framer Motion, TanStack Query / Router / Table, Zustand
- **Backend:** Node.js + Hono + Zod (in-memory data, no database)

## Security note

Every route is open. Sessions are still signed and encrypted cookies (AES-GCM + HMAC), but a missing cookie falls back to the demo user instead of returning 401. Origin checks, rate limiting, Zod validation, and security headers stay on. Don't expose this publicly as-is.

## Contributing

Issues and pull requests are welcome. Before opening a PR, run `yarn build` and `yarn test` from the root.

## License

[MIT](LICENSE)
