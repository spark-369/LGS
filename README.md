# Logic_Gate Simulator

Production-grade MERN stack application for designing, simulating, and sharing digital logic circuits. Supports 40+ gate types with real-time combinational logic evaluation, user authentication, and a community circuit gallery.

---

## Tech Stack

| Layer              | Technology                                               |
| ------------------ | -------------------------------------------------------- |
| **Frontend**       | React 18, Vite 5, MUI 5, React Flow 12, Zustand 5, Axios |
| **Backend**        | Node.js 20, Express 4, MongoDB 7, Mongoose 8             |
| **Auth**           | JWT (jsonwebtoken), bcrypt                               |
| **Validation**     | express-validator, zod                                   |
| **Infrastructure** | Docker, Docker Compose, Nginx                            |
| **Dev Tooling**    | ESLint 9, Vitest 2, Jest 29                              |

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Nginx (80)    │───▶│   Frontend      │    │  Backend (5000)  │
│  SPA + /api     │    │  React/Vite     │    │  Express API     │
└─────────────────┘    └─────────────────┘    └────────┬─────────┘
                                                       │
                                                ┌──────▼──────┐
                                                │  MongoDB    │
                                                │  (27017)    │
                                                └─────────────┘
```

**Request flow:** Nginx serves the built React SPA and reverse-proxies `/api` requests to the backend service. The backend handles authentication, circuit CRUD, and delegates simulation to the frontend client-side engine for real-time interactivity.

---

## Features

### Core Application

- **Circuit Editor** — Drag-and-drop canvas with 40+ logic gates, wires, and real-time simulation
- **Simulation Engine** — Fixed-point propagation algorithm with 120ms polling; supports INPUT, OUTPUT, AND, OR, NOT, NAND, NOR, XOR, XNOR, BUFFER, TRISTATE, multi-input variants (3-5), MUX2/4/8, AOI/OAI families, MAJ3/4/5, EQ2/3
- **Gate Palette** — Categorized, searchable gate library with color-coded families
- **Public Gallery** — Browse and duplicate community circuits
- **Authentication** — JWT-based register/login with secure password hashing
- **Circuit Management** — Create, read, update, delete, duplicate, and toggle public/private visibility
- **Dark/Light Mode** — Persisted theme with full canvas and component coverage

### Engineering

- **Type-safe validation** — express-validator + zod on all inputs
- **Pagination & search** — Circuit list supports page/limit and regex text search
- **Error handling** — Centralized Express error middleware with stack traces in development only
- **CORS isolation** — Restricted to configured client origin
- **Health endpoint** — Liveness probe at `/api/health/health`
- **Multi-stage Docker builds** — Optimized production images with layer caching
- **Graceful degradation** — Reduced-motion support, skeleton loading, snackbar feedback

---

## Project Structure

```
v1/
├── docker-compose.yml          # Orchestration: mongodb, backend, frontend
├── backend/
│   ├── Dockerfile              # Multi-stage Node 20 Alpine build
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── server.js           # App bootstrap, CORS, error handling
│       ├── config/
│       │   └── db.js           # Mongoose connection
│       ├── models/
│       │   ├── User.js         # email, password (bcrypt), name
│       │   └── Circuit.js      # name, description, owner, nodes, edges, isPublic
│       ├── controllers/
│       │   ├── authController.js
│       │   └── circuitController.js
│       ├── middleware/
│       │   ├── auth.js         # JWT verification, user attachment
│       │   └── validation.js   # express-validator chains + zod schemas
│       ├── routes/
│       │   ├── auth.js
│       │   ├── circuits.js
│       │   └── health.js
│       └── services/
│           └── simulation.js   # 39-gate logic evaluation engine
└── frontend/
    ├── Dockerfile              # Node builder + nginx:alpine
    ├── nginx.conf              # SPA fallback, /api proxy
    ├── .gitignore
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx            # Provider stack: Router, Theme, Auth
        ├── App.jsx              # Routes, guards, transitions
        ├── theme/
        │   ├── theme.js         # MUI theme factory, palette, shadows
        │   └── ColorModeContext.jsx
        ├── store/
        │   └── authStore.js     # Zustand auth state + localStorage sync
        ├── services/
        │   └── api.js           # Axios instance, interceptors, auth/circuit APIs
        ├── utils/
        │   └── simulation.js    # Client-side combinational logic evaluator
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx    # Circuit CRUD, search, pagination, stats
        │   ├── PublicCircuits.jsx
        │   ├── Editor.jsx       # React Flow canvas, gate palette, save
        │   └── NotFound.jsx
        ├── components/
        │   ├── Header.jsx
        │   ├── Logo.jsx
        │   ├── ThemeToggle.jsx
        │   ├── PageTransition.jsx
        │   ├── auth/AuthLayout.jsx
        │   ├── canvas/Toolbar.jsx
        │   ├── circuit/ (CircuitCard, EmptyState, SkeletonCard)
        │   ├── common/ConfirmDialog.jsx
        │   └── gates/LogicGateNode.jsx
        ├── styles/
        │   ├── global.css
        │   └── canvas.css
        └── hooks/
            └── useAuth.jsx
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- MongoDB >= 7 (or Docker)
- npm

### Local Development

**1. Clone and install dependencies**

```bash
git clone <repository-url>
cd Logic_Gate_Simulator/v1

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

**2. Configure environment**

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/logic-gate-simulator
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**3. Start MongoDB**

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**4. Run development servers**

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`.

---

## API Reference

Base URL: `http://localhost:5000/api`

### Health

| Method | Endpoint         | Auth | Description          |
| ------ | ---------------- | ---- | -------------------- |
| `GET`  | `/health/health` | No   | Service health check |

### Authentication

| Method | Endpoint         | Auth | Description                               |
| ------ | ---------------- | ---- | ----------------------------------------- |
| `POST` | `/auth/register` | No   | Register user `{ name, email, password }` |
| `POST` | `/auth/login`    | No   | Login `{ email, password }`               |
| `GET`  | `/auth/me`       | Yes  | Get current user                          |
| `POST` | `/auth/refresh`  | Yes  | Refresh JWT                               |

### Circuits

| Method   | Endpoint                  | Auth | Description                                                       |
| -------- | ------------------------- | ---- | ----------------------------------------------------------------- |
| `GET`    | `/circuits/public`        | No   | List public circuits                                              |
| `POST`   | `/circuits`               | Yes  | Create circuit `{ name?, description?, isPublic? }`               |
| `GET`    | `/circuits`               | Yes  | List user circuits (query: `page`, `limit`, `search`, `isPublic`) |
| `GET`    | `/circuits/:id`           | Yes  | Get circuit (owner or public)                                     |
| `PUT`    | `/circuits/:id`           | Yes  | Update circuit (owner only)                                       |
| `PATCH`  | `/circuits/:id/public`    | Yes  | Toggle public/private (owner only)                                |
| `DELETE` | `/circuits/:id`           | Yes  | Delete circuit (owner only)                                       |
| `POST`   | `/circuits/:id/duplicate` | Yes  | Duplicate circuit                                                 |

**Circuit body schema:**

```json
{
  "name": "Half Adder",
  "description": "Adds two bits",
  "isPublic": true,
  "nodes": [
    {
      "id": "1",
      "type": "INPUT",
      "position": { "x": 0, "y": 0 },
      "data": { "label": "A", "value": true }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "3",
      "sourceHandle": "out",
      "targetHandle": "input-0"
    }
  ]
}
```

---

## Docker Deployment

### Production (Docker Compose)

```bash
docker-compose up --build -d
```

Services:

- **Frontend** — `http://localhost` (port 80)
- **Backend** — `http://localhost:5000` (port 5000)
- **MongoDB** — `localhost:27017` (port 27017)

### Environment Variables (Production)

Override in `docker-compose.yml` or `.env`:

| Variable      | Default                                        | Description                |
| ------------- | ---------------------------------------------- | -------------------------- |
| `MONGODB_URI` | `mongodb://mongodb:27017/logic-gate-simulator` | Internal MongoDB URI       |
| `CLIENT_URL`  | `http://localhost`                             | CORS origin for production |
| `JWT_SECRET`  | _(required)_                                   | Strong random secret       |
| `NODE_ENV`    | `production`                                   | Application environment    |

### Individual Service Builds

```bash
# Backend only
docker build -t logic-gate-backend ./backend

# Frontend only
docker build -t logic-gate-frontend ./frontend
```

---

## Data Model

### User

| Field       | Type     | Notes                              |
| ----------- | -------- | ---------------------------------- |
| `_id`       | ObjectId | Auto-generated                     |
| `email`     | String   | Unique, lowercase                  |
| `password`  | String   | bcrypt hash, excluded from queries |
| `name`      | String   | Display name                       |
| `createdAt` | Date     | Auto                               |
| `updatedAt` | Date     | Auto                               |

### Circuit

| Field         | Type     | Notes                         |
| ------------- | -------- | ----------------------------- |
| `_id`         | ObjectId | Auto-generated                |
| `name`        | String   | Max 100 chars                 |
| `description` | String   | Max 500 chars, optional       |
| `owner`       | ObjectId | Ref: User                     |
| `nodes`       | Array    | Embedded gate documents       |
| `edges`       | Array    | Embedded connection documents |
| `isPublic`    | Boolean  | Default false                 |
| `createdAt`   | Date     | Auto                          |
| `updatedAt`   | Date     | Auto                          |

**Indexes:** `{ owner: 1, createdAt: -1 }`, text index on `name` + `description`.

---

## Scripts

### Backend

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Start with nodemon |
| `npm start`    | Production start   |
| `npm run lint` | ESLint             |
| `npm test`     | Jest               |

### Frontend

| Command           | Description                 |
| ----------------- | --------------------------- |
| `npm run dev`     | Vite dev server (port 5173) |
| `npm run build`   | Production build            |
| `npm run preview` | Preview production build    |
| `npm run lint`    | ESLint                      |
| `npm test`        | Vitest                      |

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT signed with `JWT_SECRET`, 7-day expiry
- `select: false` on password field prevents accidental exposure
- CORS restricted to `CLIENT_URL`
- Centralized error handler; stack traces hidden in production
- Input validation on all endpoints via express-validator + zod

---

## Contributing

1. Fork and clone the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Install dependencies in both `backend/` and `frontend/`
4. Make changes with linting: `npm run lint`
5. Run tests: `npm test`
6. Commit and push: `git commit -m "feat: description"` and `git push origin feature/your-feature`
7. Open a pull request

### Commit Convention

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — maintenance, dependencies, config

---

## License

ISC
