# Logic Gate Simulator

A full-stack **MERN** application for designing, simulating and sharing digital
logic-gate circuits in the browser. Users drag gates onto a canvas, wire them
together, watch signal values propagate in real time, and persist designs to
their account — or publish them to a public community gallery.

The project is split into two independently runnable services:

| Service    | Stack                                                   | Port (dev) | Port (Docker) |
| ---------- | ------------------------------------------------------- | :--------: | :-----------: |
| `backend/` | Node 20 · Express 4 · Mongoose 8 · JWT (ES modules)      |  `5000`    |    `5000`     |
| `frontend/`| React 18 · Vite 5 · MUI 5 · React Flow 12 · Zustand 5    |  `5173`    |  `80` (nginx) |

A `docker-compose.yml` at the repository root wires both services together with
MongoDB 7 for a one-command deployment.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Repository Layout](#repository-layout)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Backend Documentation](#backend-documentation)
7. [Frontend Documentation](#frontend-documentation)
8. [REST API Reference](#rest-api-reference)
9. [Gate Library](#gate-library)
10. [Simulation Engine](#simulation-engine)
11. [Testing](#testing)
12. [Security Notes](#security-notes)
13. [Troubleshooting](#troubleshooting)
14. [License](#license)

---

## Features

- **Drag-and-drop circuit editor** built on React Flow with a categorised gate
  palette (47 gate types), pan/zoom, minimap and keyboard shortcuts.
- **Real-time simulation** — a fixed-point evaluator propagates logic values
  through the whole graph while the simulation is toggled on.
- **Persistent circuits** — create, read, update, duplicate and delete designs,
  scoped to the authenticated owner.
- **Public gallery** — publish circuits, browse the community feed, and fork
  (duplicate) any public circuit into your own dashboard.
- **JWT authentication** — register/login with hashed passwords (bcrypt) and a
  short-lived access token, plus silent session restore on page load.
- **Light/dark theming** — a system-aware MUI theme with a manual toggle that
  persists to `localStorage`.
- **Hardened API** — validation on every write, CORS allow-listing, security
  headers, dependency-free rate limiting, and centralised error handling.
- **Tested** — Jest (native ESM) on the backend and Vitest + Testing Library on
  the frontend.

---

## Architecture

```
┌────────────────────────┐        HTTPS / JSON         ┌────────────────────────┐
│        Frontend        │  ──  /api/* (axios)  ──────▶ │        Backend         │
│  React SPA (Vite build)│                              │  Express REST API      │
│                        │  ◀──  { ...json... }  ────── │                        │
│  • React Flow editor   │                              │  • routes → controllers│
│  • Zustand auth store  │                              │  • mongoose models     │
│  • MUI theme + UI      │                              │  • JWT middleware      │
└────────────────────────┘                              └───────────┬────────────┘
                                                                     │ Mongoose
                                                                     ▼
                                                         ┌────────────────────────┐
                                                         │        MongoDB 7       │
                                                         │  users · circuits      │
                                                         └────────────────────────┘
```

- The **frontend never talks to MongoDB directly** — all persistence goes through
  the REST API.
- In development, Vite proxies `/api` to `http://localhost:5000`
  (see `frontend/vite.config.js`). In production the nginx image reverse-proxies
  `/api` to the `backend` service (see `frontend/nginx.conf`).
- The **logic-gate evaluation logic is intentionally duplicated** in
  `backend/src/services/simulation.js` and `frontend/src/utils/simulation.js` so
  the client can simulate locally (live, without round-trips) while the server
  can validate and expose deterministic results for stored circuits.

---

## Repository Layout

```
v1/
├── docker-compose.yml          # MongoDB + backend + frontend orchestration
├── .env                        # Compose-level secrets (JWT_SECRET, CLIENT_URL)
├── README.md                   # ← this file
│
├── backend/                    # Express REST API (ES modules)
│   ├── Dockerfile              # Multi-stage Node 20 image + healthcheck
│   ├── .dockerignore
│   ├── .env                    # Service-local environment (dev)
│   ├── eslint.config.js        # ESLint 9 flat config
│   ├── jest.config.mjs         # Jest config (native ESM, no Babel)
│   ├── package.json
│   ├── src/
│   │   ├── server.js           # App bootstrap, middleware, graceful shutdown
│   │   ├── config/db.js        # Single Mongoose connection
│   │   ├── constants/gates.js  # Gate type list + pin counts (source of truth)
│   │   ├── controllers/        # authController.js · circuitController.js
│   │   ├── middleware/         # auth · validation · errorHandler · rateLimit
│   │   ├── models/             # User.js · Circuit.js
│   │   ├── routes/             # auth.js · circuits.js · health.js
│   │   ├── services/           # simulation.js (gate truth tables + evaluator)
│   │   └── utils/strings.js    # escapeRegex, normalizeText
│   └── tests/
│       ├── setup.js            # Deterministic env for tests
│       ├── helpers/mockQuery.js# Chainable Mongoose query double
│       ├── integration/        # authRoutes · circuitRoutes · healthRoutes
│       └── unit/               # simulation · validation · auth · errorHandler
│
└── frontend/                   # React SPA (Vite)
    ├── Dockerfile              # build → nginx:alpine
    ├── nginx.conf              # SPA fallback, asset caching, /api proxy
    ├── .dockerignore
    ├── index.html
    ├── vite.config.js          # Dev proxy + manual vendor chunks
    ├── vitest.config.js        # jsdom test environment
    ├── eslint.config.js
    ├── package.json
    └── src/
        ├── main.jsx            # Root: ErrorBoundary → Router → Theme → Auth
        ├── App.jsx             # Route table + lazy loading
        ├── pages/              # Login · Register · Dashboard · PublicCircuits · Editor · NotFound
        ├── components/
        │   ├── canvas/Toolbar.jsx   # Editor toolbar + gate palette
        │   ├── gates/               # LogicGateNode · GateSymbol · GatePin · tokens
        │   ├── circuit/             # CircuitCard · CircuitPreview · SkeletonCard · EmptyState
        │   ├── common/              # ConfirmDialog · LoadingScreen · ErrorBoundary
        │   ├── auth/AuthLayout.jsx
        │   └── Header · Logo · ThemeToggle · PageTransition
        ├── hooks/useAuth.jsx   # AuthProvider + useAuth() context
        ├── store/authStore.js  # Zustand auth state + persistence
        ├── services/api.js     # axios instance, interceptors, API surface
        ├── theme/              # theme.js (MUI factory) · ColorModeContext.jsx
        ├── utils/              # gates · gateTemplates · circuit · simulation
        ├── styles/             # global.css · canvas.css
        ├── test-utils/renderWithTheme.jsx
        └── setupTests.js
```

---

## Quick Start

### Prerequisites

| Tool           | Version         | Notes                                  |
| -------------- | --------------- | -------------------------------------- |
| Node.js        | `>= 20`         | Enforced by `engines` in both services |
| npm            | `>= 9`          | Ships with Node 20                     |
| MongoDB        | `6+` / `7`      | Local instance or the Compose service  |
| Docker Compose | optional        | For the containerised workflow         |

### Run with Docker Compose

From the repository root:

```bash
# 1. Provide the required secrets (compose reads the root .env).
#    A development .env is already committed; replace JWT_SECRET for production.
#    Generate a strong value with:
openssl rand -hex 32

# 2. Build and start all three services (mongodb, backend, frontend).
docker compose up --build

# Frontend:  http://localhost
# API:       http://localhost:5000
# MongoDB:   mongodb://localhost:27017
```

Compose boots in dependency order: MongoDB is health-checked first, the backend
waits for a healthy database, and the frontend waits for the backend.

### Run Locally (Development)

Run the three services in separate terminals.

**1. MongoDB** — start a local instance (or use the Compose `mongodb` service):

```bash
docker compose up -d mongodb
```

**2. Backend** (from `backend/`):

```bash
cd backend
npm install
# .env is committed for development; edit it if your Mongo URI differs.
npm run dev            # nodemon → http://localhost:5000
```

**3. Frontend** (from `frontend/`):

```bash
cd frontend
npm install
npm run dev            # Vite → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so the frontend
needs no CORS configuration during development.

**Useful scripts**

| Where      | Command                  | Purpose                                   |
| ---------- | ------------------------ | ----------------------------------------- |
| `backend/` | `npm run dev`            | Start API with hot reload (nodemon)       |
| `backend/` | `npm start`              | Start API (production mode)               |
| `backend/` | `npm run lint`           | ESLint over `src/` and `tests/`           |
| `backend/` | `npm test`               | Run Jest (native ESM)                     |
| `backend/` | `npm run test:coverage`  | Jest with coverage (text + lcov)          |
| `frontend/`| `npm run dev`            | Vite dev server                           |
| `frontend/`| `npm run build`          | Production build into `dist/`             |
| `frontend/`| `npm run preview`        | Preview the production build locally      |
| `frontend/`| `npm run lint`           | ESLint over `src/`                        |
| `frontend/`| `npm test`               | Run Vitest once                           |
| `frontend/`| `npm run test:coverage`  | Vitest with V8 coverage                   |

---

## Environment Variables

### Backend (`backend/.env`)

`src/server.js` loads environment files in a deliberate order — the **first**
file to define a key wins (`dotenv` never overwrites an already-set variable):

1. `backend/.env` (service-local, highest priority)
2. `<cwd>/.env`
3. `<repo root>/.env` (compose-level fallback)

| Variable          | Required | Default      | Description                                        |
| ----------------- | :------: | ------------ | -------------------------------------------------- |
| `MONGODB_URI`     |   ✅     | —            | MongoDB connection string. **Startup fails without it.** |
| `JWT_SECRET`      |   ✅     | —            | Signing secret for access tokens. **Startup fails without it.** |
| `PORT`            |          | `5000`       | HTTP port the API listens on.                      |
| `NODE_ENV`        |          | `development`| Controls error verbosity and HSTS.                 |
| `JWT_EXPIRE`      |          | `7d`         | Access-token lifetime (jsonwebtoken format).       |
| `CLIENT_URL`      |          | `http://localhost:5173` | Comma-separated CORS allow-list of browser origins. |
| `JSON_BODY_LIMIT` |          | `5mb`        | Max request body size (circuits are stored as JSON).|

If any **required** variable is missing, the process logs the missing names and
exits with code `1` before opening a port.

### Frontend (`frontend/.env`)

Vite exposes variables prefixed with `VITE_` via `import.meta.env`.

| Variable        | Default | Description                                                       |
| --------------- | ------- | ---------------------------------------------------------------- |
| `VITE_API_URL`  | `/api`  | Base URL for all API calls. Defaults to the relative `/api` path, which is proxied (dev) or reverse-proxied (prod). |

### Compose-level (root `.env`)

Used by `docker-compose.yml`:

| Variable      | Required | Description                                              |
| ------------- | :------: | -------------------------------------------------------- |
| `JWT_SECRET`  |   ✅     | Injected into the backend container (compose errors if unset). |
| `JWT_EXPIRE`  |          | Token lifetime (defaults to `7d`).                       |
| `CLIENT_URL`  |          | Allowed browser origin (defaults to `http://localhost`). |


---

## Backend Documentation

The API is a small, layered Express application written as **native ES modules**
(`"type": "module"`, explicit `.js` import extensions). It follows a classic
thin-router / fat-controller structure with shared middleware and Mongoose models.

### Request lifecycle

```
HTTP request
   ▼
CORS allow-list  →  JSON body parser  →  security headers  →  /api rate limiter
   ▼
Route (routes/*.js)         # path + HTTP verb wiring
   ▼
Validation chains           # express-validator (+ zod for query coercion)
   ▼
Auth middleware             # verify JWT, hydrate req.user (or optionalAuth)
   ▼
Controller                  # sanitise input, talk to the model, shape the response
   ▼
Model (Mongoose)            # schema-level validation + persistence
   ▼
Response  ──or──▶  next(error)  →  centralised errorHandler  →  JSON error
```

### Entry point — `src/server.js`

- Loads `.env` files in the documented priority order and **exits if
  `MONGODB_URI` or `JWT_SECRET` is missing**.
- Disables `x-powered-by` and sets `trust proxy` (so `req.ip` is correct behind
  nginx / load balancers).
- Configures **CORS** from a comma-separated `CLIENT_URL` allow-list; requests
  with no `Origin` (curl, health probes) are always allowed.
- Applies **security headers**: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`, and
  `Strict-Transport-Security` in production.
- Mounts a **global `/api` rate limiter** (300 requests / minute / identity).
- Mounts the route groups: `/api/health`, `/api/auth`, `/api/circuits`.
- Installs `notFoundHandler` then `errorHandler` as the terminal middleware.
- Connects to MongoDB, starts the HTTP server, and installs **graceful shutdown**
  on `SIGINT`/`SIGTERM` (closes the server, then the Mongoose connection).

### Configuration — `src/config/db.js`

A thin wrapper around `mongoose.connect` with `serverSelectionTimeoutMS: 10s`
and a connection pool of `10`. It logs connect/disconnect/error events and
resolves the connection so the caller decides whether to abort startup.
`strictQuery` is enabled to reject unknown query paths.

### Constants — `src/constants/gates.js` (single source of truth)

Every gate the stack understands is declared here and imported by the schema
enum, the validation layer and the evaluator:

- `GATE_TYPES` — the frozen list of **47 gate identifiers**.
- `GATE_INPUT_COUNTS` — pin count per gate. Multiplexers are *data-first*:
  `MUX2 = 3`, `MUX4 = 6`, `MUX8 = 11` (D0..D7 then S0..S2).
- `MUX_DATA_PINS` / `MUX_SELECT_PINS` — mux pin breakdown.
- `MAX_NODES_PER_CIRCUIT` (`400`) and `MAX_EDGES_PER_CIRCUIT` (`800`) — hard
  ceilings so a single request cannot exhaust the worker.
- `DEFAULT_SOURCE_HANDLE` (`output-0`) / `DEFAULT_TARGET_HANDLE` (`input-0`).
- Helpers: `isValidGateType(type)`, `inputCountFor(type)`.

### Models — `src/models/`

**`User.js`**

| Field      | Type   | Rules                                             |
| ---------- | ------ | ------------------------------------------------- |
| `email`    | String | required, unique, lowercased, trimmed, regex-validated |
| `password` | String | required, min 6, **`select: false`** (never returned by default) |
| `name`     | String | required, trimmed, min 2                           |
| `createdAt` / `updatedAt` | Date | via `timestamps: true`           |

- A `pre('save')` hook hashes the password with **bcrypt (cost 12)** only when
  the field changed.
- `comparePassword(password)` wraps `bcrypt.compare`.
- `toJSON()` strips the password hash from any serialisation.

**`Circuit.js`**

Embedded `nodeSchema` and `edgeSchema` (both `_id: false`):

| Node field        | Type    | Notes                                   |
| ----------------- | ------- | --------------------------------------- |
| `id`              | String  | required (client-generated)             |
| `type`            | String  | required, `enum: GATE_TYPES`            |
| `position.x/.y`   | Number  | required                                |
| `data.label`      | String  | default `''`, max 60                    |
| `data.value`      | Boolean | default `false`                         |
| `data.inputCount` | Number  | default 2, min 0, max 16                |

| Edge field     | Type   | Notes                             |
| -------------- | ------ | --------------------------------- |
| `id`           | String | required                          |
| `source`       | String | required                          |
| `sourceHandle` | String | required, default `output-0`      |
| `target`       | String | required                          |
| `targetHandle` | String | required, default `input-0`       |

`circuitSchema` also has `name` (1–100), `description` (max 500),
`owner` (ObjectId ref `User`, indexed), `nodes`/`edges` arrays with max-length
validators, and `isPublic` (default `false`). It enables `timestamps`, exposes
`gateCount`/`wireCount` virtuals, and declares three indexes:

- `{ owner: 1, createdAt: -1 }`
- `{ isPublic: 1, createdAt: -1 }`
- `{ name: 'text', description: 'text' }`

### Controllers — `src/controllers/`

**`authController.js`**

- `generateToken(id)` signs `{ id }` with `JWT_SECRET` and `JWT_EXPIRE`.
- `publicUser(user)` returns a stable `{ id, _id, email, name, createdAt }`
  projection so every response shape matches.
- `register` — rejects duplicate emails (409), creates the user, returns
  `201 { token, user }`.
- `login` — fetches `+password`, compares, and returns the **same 401 message**
  for "no user" and "wrong password" to prevent email enumeration.
- `getMe` / `refreshToken` — both require auth and return the public user
  (`refresh` also issues a fresh token).

**`circuitController.js`**

- **Sanitisation** — `sanitizeNodes` / `sanitizeEdges` copy each field
  explicitly (string-cast ids, clamp `inputCount` to 0–16, truncate labels),
  so a client can never rewrite `owner`, inject `_id`s or smuggle extra keys.
- **Graph integrity** — `assertGraphIntegrity` rejects unknown gate types,
  duplicate node ids, and wires referencing non-existent nodes (400).
- `presentCircuit` strips `owner` (unless requested) and adds
  `gateCount` / `wireCount`; `paginate` builds the shared pagination envelope.
- Search terms pass through `escapeRegex` before reaching `$regex`, defeating
  ReDoS and unintended wildcard behaviour.

| Handler                 | Behaviour                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `createCircuit`         | Sanitises the body, forces `owner = req.user._id`, returns `201`.            |
| `getCircuits`           | Owner-scoped; filters by `search`/`isPublic`, sorts by `recent`/`name`/`gates`, paginated. |
| `getPublicCircuits`     | `isPublic: true`, owner populated (`name`), computes an `isOwner` flag per row from the optional viewer. |
| `getCircuit`            | Owner **or** public; returns the circuit and `isOwner`.                       |
| `updateCircuit`         | Partial (`$set`), owner-scoped, `runValidators`.                              |
| `deleteCircuit`         | Owner-scoped, returns the deleted id.                                         |
| `duplicateCircuit`      | Copies a readable circuit into a private `"<name> (Copy)"`.                   |
| `togglePublic`          | Flips `isPublic`, or honours an explicit body value.                          |
| `simulateStoredCircuit` | Runs the stored graph through the shared evaluator; returns `outputs`, `values`, `nodeCount`, `edgeCount`. |

### Middleware — `src/middleware/`

- **`auth.js`** — `authenticate` reads the `Bearer` token, verifies it, loads the
  user into `req.user`, and 401s on any failure. `optionalAuth` attaches
  `req.user` when a valid token is present but never rejects (used by the public
  gallery). It also re-exports the validation chains for convenience.
- **`validation.js`** — express-validator chains (`validateRegister`,
  `validateLogin`, `validateCircuit`, `validateObjectId`, `validateCircuitQuery`)
  plus `handleValidationErrors`, which emits a stable
  `{ message, errors: [{ field, message }] }` payload. A **zod** `circuitQuerySchema`
  documents/coerces query params (`page`, `limit` ≤ 50, `search`, `isPublic`,
  `sort`) and is surfaced via the health `meta` endpoint.
- **`errorHandler.js`** — `ApiError(status, message, details)` for throwable HTTP
  errors; `notFoundHandler` for unmatched routes; and `errorHandler`, which maps
  Mongoose `ValidationError` (400 with field errors), `CastError` (400) and
  duplicate-key `code 11000` (409), never leaks internals for 5xx outside
  development, and only includes a stack trace in development 5xx responses.
- **`rateLimit.js`** — a dependency-free fixed-window limiter. Buckets are keyed
  by identity + method + path, swept every 60s (with `unref()` so it never keeps
  the process alive), and emit `X-RateLimit-*` / `Retry-After` headers with a
  `429` body on breach.

### Services — `src/services/simulation.js`

The server-side gate evaluator (kept in sync with the frontend copy). See
[Simulation Engine](#simulation-engine) for the algorithm.

### Utilities — `src/utils/strings.js`

- `escapeRegex(value)` — escapes every regex metacharacter (used before `$regex`).
- `normalizeText(value)` — collapses whitespace and trims.

---

## Frontend Documentation

A single-page React application built with **Vite**, styled with **MUI 5**, and
using **React Flow (`@xyflow/react`) 12** for the circuit canvas. State is split
between a small **Zustand** store (auth) and React context (theme + auth hook).

### Bootstrap — `src/main.jsx`

The provider order is deliberate and must be preserved:

```
<ErrorBoundary>            # catches any render-time crash anywhere below
  <BrowserRouter>
    <ColorModeProvider>    # MUI theme + CssBaseline + light/dark mode
      <AuthProvider>       # session restore + useAuth() context
        <App />
```

### Routing — `src/App.jsx`

All pages are **lazy-loaded** (`React.lazy` + `Suspense`) so the heavy React Flow
editor chunk is only fetched when the editor is opened.

| Path           | Page              | Guard            | Notes                                     |
| -------------- | ----------------- | ---------------- | ----------------------------------------- |
| `/login`       | `Login`           | `GuestOnlyRoute` | Redirects signed-in users to `/dashboard` |
| `/register`    | `Register`        | `GuestOnlyRoute` | Password strength + confirm match         |
| `/dashboard`   | `Dashboard`       | `ProtectedRoute` | Owned circuits, stats, CRUD               |
| `/public`      | `PublicCircuits`  | none             | Public gallery, forks require sign-in     |
| `/editor/:id?` | `Editor`          | `ProtectedRoute` | New (`/editor`) or existing circuit       |
| `/`            | → `/dashboard`    | redirect         |                                            |
| `*`            | `NotFound`        | none             | 404 page                                  |

`HEADERLESS` routes (`/login`, `/register`, `/editor`) render their own
full-bleed chrome; everything else shows the shared `<Header />`.
`ScrollToTop` resets scroll on navigation.

### API layer — `src/services/api.js`

- A single axios instance (`baseURL = import.meta.env.VITE_API_URL || '/api'`,
  20s timeout, JSON headers).
- **`tokenStorage`** wraps `localStorage` under the key `lgs.token` with
  try/catch (Safari private mode throws).
- **Request interceptor** attaches `Authorization: Bearer <token>` when present.
- **Response interceptor** clears the token and fires a registered
  `onUnauthorized` handler on a genuine `401` (login/register 401s are treated
  as credential failures, not session expiry).
- Helpers: `getErrorMessage(error, fallback)` and `getFieldErrors(error)`.
- API surface: `authAPI` (`register`/`login`/`getMe`/`refresh`),
  `circuitAPI` (`getAll`/`getPublic`/`getOne`/`create`/`update`/`delete`/
  `duplicate`/`togglePublic`/`simulate`) and `healthAPI`.

### Auth — `src/store/authStore.js` + `src/hooks/useAuth.jsx`

- **`authStore`** (Zustand) holds `user`, `token`, `initializing`, `loading`,
  `error`. `initialize()` validates any persisted token against `GET /auth/me`;
  `login`/`register` persist the token and public user; `logout` clears both.
  The user object is mirrored to `localStorage` under `lgs.user`.
- **`useAuth`** exposes `AuthProvider` and a `useAuth()` hook. It subscribes to
  the store, runs `initialize()` on mount, registers the API `onUnauthorized`
  handler to log out and navigate to `/login` (router navigation instead of a
  hard reload), and derives `isAuthenticated = Boolean(token && user)`.

### Theming — `src/theme/`

- **`theme.js`** exports `createAppTheme(mode)` — a MUI theme factory with an
  indigo/sky brand palette, light + dark backgrounds, tuned shadows, a 12px
  base radius, the Inter typeface, and component overrides (buttons, cards,
  inputs, tooltip, app bar, dialog, menu, …). `GRADIENTS` provides the brand
  gradients used across hero panels.
- **`ColorModeContext.jsx`** — reads the initial mode from `localStorage`
  (`lgs-color-mode`) or the OS `prefers-color-scheme`, persists changes, sets
  `data-theme` / `color-scheme` on `<html>`, and memoizes the MUI theme.
  `ThemeToggle` consumes it.

### Editor — `src/pages/Editor.jsx` + `src/components/`

The editor is the core screen:

- **React Flow** canvas with `Background`, `Controls` and a colour-coded
  `MiniMap`; custom `nodeTypes.logicGate = LogicGateNode`.
- **Toolbar** (`components/canvas/Toolbar.jsx`) — editable circuit name, gate
  palette popover with search + categorised cards + quick chips, delete-selected,
  simulate toggle, and save.
- **Adding gates** (`getGateTemplate`) drops a node at the viewport centre with
  `data.type` set (the renderer, minimap and simulator all read `data.type`).
- **Simulation** — while toggled on, a 120ms interval re-runs `simulateCircuit`
  over the current nodes/edges and updates node `data.value`.
- **Dirty tracking** — a canonical `snapshot()` (name + serialized nodes/edges)
  is compared against the last saved snapshot; a `beforeunload` guard warns on
  unsaved changes.
- **Save** — `PUT` for existing circuits, `POST` + `navigate(replace)` for new
  ones; keyboard shortcuts `Del`/`Backspace` (delete) and `Ctrl/⌘+S` (save).

### Gate rendering — `src/components/gates/`

- **`LogicGateNode.jsx`** — the canvas node, styled as an *instrument panel*:
  header (ref-designator + live state), a labelled input-pin column, the gate
  symbol, an output terminal, and a footer with the part number and arity.
- **`GatePin.jsx`** — one fixed-height pin row. Because the `<Handle>` is
  positioned **inside its own row**, wires always line up with the correct
  labelled pin regardless of gate type. (`gateNodeTokens.js` holds geometry,
  colours and typography tokens.)
- **`GateSymbol.jsx`** — ANSI/IEEE-style SVG symbols authored in a 64×40
  viewBox, with inversion bubbles appended on the right edge. `GateSymbol` is
  reused by the palette, canvas and card thumbnails.

### Other UI components

| Component                 | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `Header.jsx`              | App bar: logo, nav, theme toggle, user menu, mobile drawer.         |
| `Logo.jsx`                | Brand mark (gradient tile + wordmark).                              |
| `ThemeToggle.jsx`         | Light/dark switch backed by `ColorModeContext`.                     |
| `PageTransition.jsx`      | Fade/lift wrapper for routed pages (respects reduced motion).       |
| `common/ErrorBoundary`    | Catches render errors, shows a recovery screen (+ stack in dev).    |
| `common/LoadingScreen`    | Centered spinner with a label.                                      |
| `common/ConfirmDialog`    | Reusable confirmation dialog (replaces `window.confirm`).           |
| `auth/AuthLayout.jsx`     | Split-screen auth shell (brand hero panel + form card).             |
| `circuit/CircuitCard.jsx` | Circuit tile with a schematic preview, metrics, and action menu.    |
| `circuit/CircuitPreview`  | To-scale miniature schematic (normalised positions + orthogonal wires). |
| `circuit/SkeletonCard`    | Loading placeholders for the grid.                                  |
| `circuit/EmptyState`      | Friendly empty-state panel with optional action button.             |

### Utilities — `src/utils/`

- **`gates.js`** — the frontend source of truth for the gate library:
  `GATE_INPUT_COUNTS`, `GATE_TYPES`, mux pin maps, `buildPinLabels`,
  `GATE_FAMILY`, `getGateFamily`, `isInverted`, `FAMILY_ACCENT`/`getGateAccent`/
  `GATE_ACCENT`, `GATE_CATEGORIES` (palette grouping), `TOTAL_GATE_COUNT`, and
  `gateShortLabel`. Mirrors `backend/src/constants/gates.js`.
- **`gateTemplates.js`** — `GATE_TEMPLATES` / `getGateTemplate(type)`, deriving
  each node's default `data` (type, short label, value, input count).
- **`circuit.js`** — serialization bridge: `serializeNodes`, `serializeEdges`,
  `deserializeNode` (React Flow ⇄ persisted API shape).
- **`simulation.js`** — `GATE_LOGIC`, `evaluateGate`, `simulateCircuit` (see
  [Simulation Engine](#simulation-engine)).

### Styles — `src/styles/`

- **`global.css`** — body/reset, custom scrollbars, shared animation utilities,
  reduced-motion handling, and the shared `.lgs-gate-symbol` SVG rules (global
  because the symbols render on the canvas, in the palette, and in card
  thumbnails).
- **`canvas.css`** — React Flow polish (node cursor, handle hover, edge stroke,
  controls, minimap) plus dark-theme overrides; loaded with the lazy Editor chunk.

---

## REST API Reference

- **Base URL (dev):** `http://localhost:5000/api`
- **Auth:** send `Authorization: Bearer <token>` for protected endpoints.
- **Content type:** `application/json`.
- **Error shape:** `{ "message": string, "errors"?: [{ "field", "message" }] }`.

### Health — `/api/health`

| Method | Path               | Auth | Description                                   |
| ------ | ------------------ | :--: | --------------------------------------------- |
| GET    | `/api/health/health` | —  | `{ status, uptime, timestamp }` (used by Docker healthcheck). |
| GET    | `/api/health/meta`   | —  | API name/version, endpoint index, and the documented query keys. |

### Auth — `/api/auth`

Protected-less endpoints are rate-limited to **10 requests / 15 min / IP**.

| Method | Path              | Auth | Body                          | Success |
| ------ | ----------------- | :--: | ----------------------------- | ------- |
| POST   | `/api/auth/register` | —  | `{ name, email, password }`   | `201 { token, user }` |
| POST   | `/api/auth/login`    | —  | `{ email, password }`         | `200 { token, user }` |
| GET    | `/api/auth/me`       | ✅ | —                             | `200 { user }` |
| POST   | `/api/auth/refresh`  | ✅ | —                             | `200 { token, user }` |

`user` = `{ id, _id, email, name, createdAt }`.

**Common errors:** `400` validation failed · `401` invalid credentials /
expired token · `409` email already registered · `429` too many attempts.

### Circuits — `/api/circuits`

All routes below the public gallery require authentication.

| Method | Path                            | Auth | Description |
| ------ | ------------------------------- | :--: | ----------- |
| GET    | `/api/circuits/public`          | opt  | Public gallery (paginated; adds `isOwner` per row). |
| POST   | `/api/circuits`                 | ✅ | Create a circuit. |
| GET    | `/api/circuits`                 | ✅ | List the caller's circuits (paginated). |
| GET    | `/api/circuits/:id`             | ✅ | Fetch one (owner or public); returns `isOwner`. |
| PUT    | `/api/circuits/:id`             | ✅ | Update (owner only, partial). |
| PATCH  | `/api/circuits/:id/public`      | ✅ | Toggle visibility (or set `{ isPublic }`). |
| POST   | `/api/circuits/:id/duplicate`   | ✅ | Duplicate into a private copy. |
| POST   | `/api/circuits/:id/simulate`    | ✅ | Evaluate the stored circuit → `{ outputs, values, nodeCount, edgeCount }`. |
| DELETE | `/api/circuits/:id`             | ✅ | Delete (owner only). |

**Query parameters** (list + public): `page` (≥1), `limit` (1–50, default 12),
`search` (≤120 chars), `isPublic` (`true`/`false`, list only), `sort`
(`recent` | `name` | `gates`).

**Body (create/update):**

```jsonc
{
  "name": "Half Adder",              // 1–100 chars, required
  "description": "XOR + AND",        // ≤500 chars, optional
  "isPublic": false,                 // boolean, optional
  "nodes": [
    {
      "id": "n1",                    // client-generated, unique
      "type": "XOR",                 // must be a known gate type
      "position": { "x": 0, "y": 0 },
      "data": { "label": "X", "value": false, "inputCount": 2 }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "sourceHandle": "output-0",
      "target": "n2",
      "targetHandle": "input-0"
    }
  ]
}
```

**Pagination envelope** (list endpoints):

```json
{
  "circuits": [ /* ... */ ],
  "pagination": { "page": 1, "limit": 12, "total": 42, "pages": 4, "hasNext": true, "hasPrev": false }
}
```

**Common errors:** `400` validation / graph integrity · `401` unauthenticated ·
`404` not found (or not owned) · `429` rate limited.

---

## Gate Library

The single source of truth is `backend/src/constants/gates.js` (backend) and
`frontend/src/utils/gates.js` (frontend); the two lists are kept in sync. There
are **47 gate types**, grouped into families that drive the symbol shape, palette
grouping and accent colour.

| Family        | Gates                                                             | Inputs |
| ------------- | ---------------------------------------------------------------- | ------ |
| I/O + buffer  | `INPUT`, `OUTPUT`, `BUFFER`, `NOT`                                | 0/1/1/1 |
| 2-input logic | `AND`, `OR`, `NAND`, `NOR`, `XOR`, `XNOR`                          | 2 |
| Tri-state     | `TRISTATE` (data + enable)                                         | 2 |
| 3-input       | `AND3`, `OR3`, `NAND3`, `NOR3`, `XOR3`, `XNOR3`                    | 3 |
| 4-input       | `AND4`, `OR4`, `NAND4`, `NOR4`, `XOR4`, `XNOR4`                    | 4 |
| 5-input       | `AND5`, `OR5`, `NAND5`, `NOR5`, `XOR5`, `XNOR5`                    | 5 |
| Multiplexers  | `MUX2` (3), `MUX4` (6), `MUX8` (11) — data pins then select pins   | 3/6/11 |
| Complex AOI/OAI | `AOI21`, `OAI21`, `AOI22`, `OAI22`, `AOI31`, `OAI31`, `AOI32`, `OAI32`, `AOI33`, `OAI33` | 3–6 |
| Arithmetic / decision | `MAJ3`, `MAJ4`, `MAJ5`, `EQ2`, `EQ3`                     | 2–5 |

**Pin labelling.**

- Multiplexers label pins `D0..D(n-1)` then `S0..S(m-1)`, output `Y`.
- Every other gate labels inputs `A, B, C, D, E…` (falling back to `I<n>` past
  five pins), output `Y`.

**Truth-table semantics.**

| Category        | Rule                                                    |
| --------------- | ------------------------------------------------------- |
| `AND*`          | high iff **all** inputs high                            |
| `OR*`           | high iff **any** input high                             |
| `NAND*` / `NOR*`| logical negation of `AND*` / `OR*`                      |
| `XOR*` / `XNOR*`| odd-parity of high inputs (resp. its negation)          |
| `NOT` / `BUFFER`| invert / pass through                                   |
| `TRISTATE`      | output = data **and** enable                            |
| `MUXn`          | output = selected data line, decoded from the S pins    |
| `MAJn`          | high iff ≥ ceil(n/2) inputs are high                    |
| `EQ2` / `EQ3`   | high iff all inputs are equal                           |
| `AOI*` / `OAI*` | AND-OR-INVERT / OR-AND-INVERT compound functions         |

---

## Simulation Engine

Implemented twice and kept in sync:

- **Frontend** — `frontend/src/utils/simulation.js` (live canvas evaluation).
- **Backend** — `backend/src/services/simulation.js` (stored-circuit validation,
  exposed via `POST /api/circuits/:id/simulate`).

### Algorithm

`simulateCircuit(nodes, edges)` evaluates a combinational graph by iterating to a
**fixed point**:

1. Seed a `values` map — `INPUT` nodes take their `data.value`, everything else
   starts LOW.
2. Build an `incoming` map: for each node, the edges whose `target` is that node.
3. For each node, assemble its input array by pin index, parsed from the edge's
   `targetHandle` (e.g. `"input-2" → 2`). The array size is
   `max(declaredInputCount, highestConnectedPinIndex + 1, 1)`; unconnected pins
   default to LOW.
4. Evaluate each gate with `evaluateGate(type, inputs)` (unknown types → LOW).
5. Repeat until no value changes, bounded to `nodes.length + 1` passes.

Key properties:

- **Order-independent** — the fixed-point loop handles any wiring/topology.
- **Feedback-safe** — self-referential loops oscillate or stabilise but always
  terminate within the bound, returning a boolean instead of hanging.
- **Multiplexers** decode select lines from the **end** of the input array
  (data-first layout), which is why `MUX8` needs 11 pins, not 10.
- **Output** — returns `{ nodes, outputs, values }`, where `outputs` contains an
  entry per `OUTPUT` gate and `values` maps every node id to its resolved boolean.

### Complexity

Bounded by `O(passes × (nodes + edges))` with `passes ≤ nodes + 1`, which is
comfortably fast for the enforced limits (≤ 400 gates / ≤ 800 wires).

---

## Testing

### Backend (Jest, native ESM)

- Config: `backend/jest.config.mjs` — Node environment, **transforms disabled**
  (Jest runs on Node's own loader via `--experimental-vm-modules`), `clearMocks`,
  `tests/setup.js` for deterministic env, coverage from `src/**` (excluding
  `server.js` and `config/db.js`).
- **Unit tests** (`tests/unit/`): `simulation` (truth tables + graph evaluation),
  `gates` (constants), `validation` (express-validator + zod), `authMiddleware`,
  `errorHandler`, `rateLimit`, `userModel` (hashing), `strings`.
- **Integration tests** (`tests/integration/`): `authRoutes`, `circuitRoutes`,
  `healthRoutes` — exercise routing → validation → controller → error handler
  end-to-end with `supertest` and mocked Mongoose models
  (`jest.unstable_mockModule` + `tests/helpers/mockQuery.js`).

```bash
cd backend
npm test                 # run once
npm run test:watch       # watch mode
npm run test:coverage    # coverage (text + lcov → coverage/)
```

### Frontend (Vitest + Testing Library)

- Config: `frontend/vitest.config.js` — `jsdom` environment, `globals: true`,
  `setupFiles: ./src/setupTests.js` (polyfills `matchMedia`, `ResizeObserver`,
  `scrollTo`), V8 coverage.
- Tests cover utilities (`gates`, `gateTemplates`, `circuit`, `simulation`),
  `services/api` (interceptors, helpers, endpoint surface), `store/authStore`,
  the theme factory, and components (`Logo`, `ThemeToggle`, `GateSymbol`,
  `GatePin`, `EmptyState`, `SkeletonCard`, `ConfirmDialog`, `LoadingScreen`).

```bash
cd frontend
npm test                 # run once
npm run test:watch       # watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # V8 coverage → coverage/
```

---

## Security Notes

| Area               | Implementation                                                            |
| ------------------ | ------------------------------------------------------------------------- |
| Passwords          | bcrypt (cost 12), `select: false`, stripped from JSON.                    |
| Auth               | JWT bearer tokens; identical 401 for bad user/password (anti-enumeration). |
| Rate limiting      | Global `300/min` on `/api`; auth endpoints `10/15min`; `429` + headers.   |
| CORS               | Origin allow-list from `CLIENT_URL`; no-Origin requests always allowed.   |
| Input validation   | express-validator chains + explicit controller sanitisation.              |
| NoSQL injection    | Bodies are copied field-by-field; `search` is regex-escaped (`escapeRegex`). |
| Graph integrity    | Unknown gate types, duplicate node ids and dangling wires rejected.       |
| Response sizing    | `MAX_NODES_PER_CIRCUIT` (400) / `MAX_EDGES_PER_CIRCUIT` (800).            |
| Body size          | `JSON_BODY_LIMIT` (default `5mb`).                                        |
| Headers            | nosniff, frame-deny, referrer, permissions-policy, HSTS (prod).           |
| Error leakage      | 5xx internals hidden outside development; stacks only in dev 5xx.         |
| Container          | nginx adds its own security headers and proxies `/api` to the backend.    |
| Secrets            | `.env` files are `.dockerignore`d; compose requires `JWT_SECRET` at runtime. |

> **Important:** the committed `.env` files contain **development** secrets. Before
> any real deployment, generate a fresh `JWT_SECRET` (`openssl rand -hex 32`) and
> set a production `MONGODB_URI` / `CLIENT_URL`.

---

## Troubleshooting

| Symptom                                    | Likely cause / fix                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| Backend exits immediately on start         | `MONGODB_URI` or `JWT_SECRET` missing — check `backend/.env`.              |
| `MongoDB connected` never logs             | MongoDB not running / wrong URI; verify the host from `MONGODB_URI`.       |
| Frontend API calls 404                     | Dev proxy vs. prod nginx mismatch; confirm you call the `/api` base path.  |
| CORS error in the browser console          | Add the frontend origin to `CLIENT_URL` (comma-separated for multiple).    |
| `401` immediately after login              | `JWT_SECRET` differs between processes — align env for all services.       |
| `429 Too many requests`                    | Rate limiter hit; wait for the window (see `Retry-After`) or raise `max`.  |
| Duplicating/opening on `/public` redirects | Those actions require a session by design — sign in first.                 |
| Unsaved-changes prompt on leave            | Editor dirty-state guard; save (`Ctrl/⌘+S`) or discard in the dialog.      |
| `npm test` fails on the backend            | Ensure Node ≥ 20 and the `--experimental-vm-modules` script is used.       |
| Blank page after a crash                   | ErrorBoundary shows a recovery screen; the stack renders in dev mode.      |

---

## License

The backend package declares **ISC** (`backend/package.json`). Unless a separate
`LICENSE` file is added, treat the project as **ISC-licensed**.


