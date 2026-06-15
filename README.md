# EIPR-Agent

Multi-Agent AI System for Entrepreneurship & Intellectual Property Rights Analysis.

EIPR-Agent is an intelligent analysis platform that takes a business idea or domain description and runs it through **5 specialized AI agents** — each mapping to a unit in the EIPR (Entrepreneurship & IP Rights) curriculum. The output is a comprehensive case study covering opportunity discovery, IP strategy, business planning, financial feasibility, and academic synthesis.

## What It Does

1. You describe a domain or idea (e.g., "AI-powered healthcare diagnostics for rural India")
2. The system runs it through 5 AI agents in sequence
3. Each agent produces structured output (opportunities, IP analysis, business plan, financials, report)
4. You can view, edit, and re-run any stage
5. Export the final case study as DOCX or PDF

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Frontend   │────▶│   Backend    │────▶│   LLM Provider   │
│  Next.js 14 │     │  FastAPI     │     │  (Ollama/OpenAI/ │
│  :3000      │     │  :8000       │     │   Anthropic etc) │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                    ┌──────┴───────┐
                    │   SQLite DB  │
                    │  (local)     │
                    └──────────────┘
```

**How data flows:**

1. User fills in a project form on the frontend → POST to backend API
2. Backend stores project in SQLite, returns project ID
3. User triggers each agent sequentially via the frontend UI
4. Each agent calls the configured LLM provider with a specialized prompt
5. Agent output (structured JSON) is saved to the database as project outputs
6. Project detail page renders each stage's data from the saved outputs
7. Final report can be exported as DOCX or PDF

**Optional infrastructure (Docker):**

| Service | Port | Purpose |
|---------|------|---------|
| **MLflow** | `:5000` | Track LLM experiments, log parameters/metrics |
| **Prometheus** | `:9090` | Collect agent performance metrics (latency, tokens, success rate) |
| **Grafana** | `:3001` | Visualize metrics on dashboards (login: admin/admin) |
| **Ollama** | `:11434` | Run LLMs locally (pull models like llama3.2, mistral) |

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript | Server-rendered UI with client interactions |
| Styling | Tailwind CSS + Custom Design System | Dark-themed UI with consistent component library |
| State | Zustand (persisted) + TanStack React Query | Auth state management + server state caching |
| Backend | Python 3.11+, FastAPI, Uvicorn | Async API server with automatic OpenAPI docs |
| ORM | SQLAlchemy 2.0 | Database abstraction (SQLite dev, PostgreSQL-ready) |
| Validation | Pydantic v2 | Request/response validation and settings management |
| Auth | JWT (python-jose) + bcrypt + HTTPBearer | Access tokens (1hr) + refresh tokens (7 days) |
| Encryption | Fernet (cryptography) | Encrypts user API keys at rest (SHA256-derived key) |
| LLM Client | Custom multi-provider (httpx + tenacity) | Supports Ollama, OpenAI, Anthropic, Groq, Gemini, Cohere, OpenRouter |
| MCP | Custom MCP Client | Patent search, trademark search, market intelligence (pluggable) |
| Agents | 5 async agents with JSON parsing | Opportunity Scout, IP Strategist, Business Architect, Financial Analyst, Pedagogical Synthesizer |
| Export | python-docx + WeasyPrint | Word document and PDF generation with fallbacks |
| MLOps | MLflow + Prometheus + Grafana (optional) | Experiment tracking, metrics collection, monitoring |
| Testing | pytest + pytest-asyncio + TestClient | Backend integration tests |

## How the Pipeline Works (5 EIPR Units)

```
Unit I & II                          Unit IV & V
  ┌──────────────────────┐            ┌──────────────────────┐
  │ Opportunity Scout    │───────────▶│   IP Strategist      │
  │ - Market gap analysis │           │ - Patent landscape   │
  │ - Opportunity ranking │           │ - Trademark search   │
  │ - Feasibility scoring│           │ - Freedom to operate  │
  └──────────────────────┘            └──────────────────────┘
           │                                      │
           ▼                                      ▼
  ┌──────────────────────┐            ┌──────────────────────┐
  │ Business Architect   │            │ Financial Analyst    │
  │ - SWOC analysis      │            │ - Cost estimation    │
  │ - Porter's 5 forces  │            │ - Revenue projection │
  │ - 4Ps marketing mix  │            │ - Break-even analysis│
  │ - STP & UVP          │            │ - Funding strategy   │
  └──────────────────────┘            └──────────────────────┘
           │                                      │
           └──────────────┬───────────────────────┘
                          ▼
              ┌──────────────────────┐
              │ Pedagogical          │
              │ Synthesizer          │
              │ - EIPR case study    │
              │ - Curriculum mapping │
              │ - Learning outcomes  │
              └──────────────────────┘
```

**Each agent in detail:**

### 1. Opportunity Scout (Units I & II)
Takes your domain description and uses the LLM to identify 3-5 concrete business opportunities. For each opportunity, it analyzes:
- Problem statement and value proposition
- Target customer and market size
- Revenue model and competitive landscape
- Feasibility score and required skills
- IP considerations and estimated effort
- Why it's entrepreneurial (EIPR alignment)

### 2. IP Strategist (Units IV & V)
For a selected opportunity, analyzes the intellectual property landscape:
- **Patent analysis**: Searches for existing patents, assesses freedom to operate, identifies white spaces
- **Trademark analysis**: Checks existing marks, recommends filing classes
- **Trade secrets**: Identifies protectable know-how
- **Copyright**: Maps copyrightable assets
- **IP roadmap**: Short/medium/long-term strategy

### 3. Business Architect (Units II & III)
Builds a comprehensive business strategy:
- **SWOC analysis**: Strengths, Weaknesses, Opportunities, Challenges
- **Porter's Five Forces**: Industry competitive analysis
- **4Ps Marketing Mix**: Product, Price, Place, Promotion strategy
- **STP analysis**: Segmentation, Targeting, Positioning
- **Unique Value Proposition**: Core differentiator
- **Growth strategy**: Go-to-market and scaling plan

### 4. Financial Analyst (Unit III)
Evaluates financial viability:
- Cost structure (development, content, marketing, operations)
- Revenue projections (3-5 year forecast)
- Break-even analysis (time to profitability)
- Funding strategy (seed → pre-Series A → Series A)
- Key metrics (CAC, LTV, LTV:CAC ratio, churn rate)

### 5. Pedagogical Synthesizer (All Units)
Combines all previous analyses into an EIPR-aligned academic case study:
- Executive summary
- Curriculum mapping (which EIPR units are covered)
- Key learnings and takeaways
- Learning outcomes mapped to each unit
- Conclusion with recommendations

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Python** | 3.11+ (3.11 recommended) | 3.12+ may have compatibility issues with some ML libraries |
| **Node.js** | 18+ | Includes npm |
| **Ollama** | Latest (optional) | Only needed for local LLM inference. Install from [ollama.ai](https://ollama.ai) |
| **Docker** | Latest (optional) | Only needed for MLflow/Prometheus/Grafana |

## Quick Start

### Step 1: Clone and install backend dependencies

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

**Troubleshooting:** If `python3.11` is not found, check available versions with `ls /opt/homebrew/bin/python*` (macOS) or `ls /usr/bin/python*` (Linux). You can install Python 3.11 from [python.org](https://python.org) or via Homebrew (`brew install python@3.11`).

### Step 2: Install frontend dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Configure environment

Edit `backend/.env` to match your setup:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./eipr_agent.db` | SQLite database file (auto-created) |
| `JWT_SECRET_KEY` | `change-this-in-production` | Secret key for signing JWT tokens. Change in production! |
| `ENCRYPTION_KEY` | `change-this-32-char-encryption-key!` | Key for encrypting user API keys. Must be 32+ characters. |
| `DEFAULT_LLM_PROVIDER` | `ollama` | Default LLM provider for all agents |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL where Ollama is running |
| `OLLAMA_DEFAULT_MODEL` | `llama3.2` | Default Ollama model to use |
| `ENABLE_MLFLOW` | `False` | Set to `true` to enable MLflow tracking |
| `LOG_LEVEL` | `INFO` | Logging level: DEBUG, INFO, WARNING, ERROR |

**For cloud LLM providers:** Uncomment and fill in the relevant API key in `.env`:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...
GEMINI_API_KEY=...
```

Then update the provider in the Settings page after logging in.

### Step 4: Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

The backend starts on `http://localhost:8000`. Verify it's running:
```bash
curl http://localhost:8000/api/health
# → {"status":"ok","version":"1.0.0","app":"EIPR-Agent"}
```

The `--reload` flag auto-restarts the server when you change Python files.

### Step 5: Start the frontend

```bash
cd frontend
npm run dev
```

The frontend starts on `http://localhost:3000`.

### Step 6: (Optional) Seed demo data

```bash
cd backend
source .venv/bin/activate
python scripts/seed_demo.py
```

This creates:
- **Demo user**: `demo@eipr.dev` / `demo123456`
- **Sample project**: "AI-Powered Personalized Learning Platform" with all 5 stages fully populated (opportunities, IP analysis, business plan, financial analysis, report)

Login and explore the complete workflow without needing an LLM.

### Step 7: (Optional) Set up Ollama for local LLM inference

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Verify
ollama list
```

The backend defaults to `http://localhost:11434` for Ollama. Make sure Ollama is running before triggering agent runs.

## Usage Guide

### Creating a new project

1. Navigate to **Projects → New Analysis**
2. Choose a sample topic (click any card to auto-fill the form) or enter your own
3. Click "Discover Opportunities" to run the first agent
4. Review the opportunities generated
5. Select an opportunity and click "Analyze IP"
6. Continue through Strategy → Finance → Report
7. Export the final case study as DOCX or PDF

### Sample topics for testing

The "New Analysis" page includes 5 pre-built sample topics:

| Topic | Domain | What it tests |
|-------|--------|---------------|
| AI-Powered Healthcare Diagnostics | HealthTech | Deep-tech AI product, regulatory landscape, B2B sales model |
| Sustainable Packaging | CleanTech | Materials science IP, manufacturing-focused strategy |
| Fintech for Gig Workers | FinTech | Service platform, regulatory compliance, unit economics |
| Smart Water Management | AgriTech | Hardware + IoT + ML, multi-technology integration |
| Plagiarism Detection | EdTech | NLP SaaS, white-space IP analysis, subscription modeling |

Each includes a detailed explanation of what the pipeline will analyze.

### Using cloud LLM providers

1. Go to **Settings → AI Settings**
2. Select your provider (OpenAI, Anthropic, Groq, etc.)
3. Enter your API key (encrypted at rest)
4. Click "Test Connection" to verify
5. Click "Save Settings"

### API documentation

When the backend is running, visit `http://localhost:8000/api/docs` for the interactive Swagger UI. All endpoints are documented with request/response schemas.

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Get JWT tokens | No |
| POST | `/api/auth/refresh` | Get new tokens using refresh token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PATCH | `/api/auth/settings` | Update LLM settings | Yes |

**Login response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Using tokens:** Send `Authorization: Bearer <access_token>` in all authenticated requests.

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/projects/` | Create a project | Yes |
| GET | `/api/projects/` | List user's projects | Yes |
| GET | `/api/projects/{id}` | Get project with all outputs | Yes |
| PATCH | `/api/projects/{id}/stage` | Update current stage | Yes |
| PUT | `/api/projects/{id}/output` | Save/update an output | Yes |
| DELETE | `/api/projects/{id}` | Delete project | Yes |

**Create project example:**
```bash
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Healthcare Platform",
    "domain": "HealthTech",
    "input_text": "I want to build an AI diagnostic platform...",
    "user_context": "Team of 3, $100K funding"
  }'
```

### Agents (AI Pipeline)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/agents/discover-opportunities` | Run Opportunity Scout | Yes |
| POST | `/api/agents/analyze-ip` | Run IP Strategist | Yes |
| POST | `/api/agents/generate-business-plan` | Run Business + Financial | Yes |
| POST | `/api/agents/generate-report` | Run Pedagogical Synthesizer | Yes |
| POST | `/api/agents/{id}/export/docx` | Export as Word document | Yes |
| POST | `/api/agents/{id}/export/pdf` | Export as PDF | Yes |

**Trigger opportunity discovery:**
```bash
curl -X POST http://localhost:8000/api/agents/discover-opportunities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "<project-uuid>"}'
```

### MLOps

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/mlops/events` | List ML events with filtering | Yes |
| GET | `/api/mlops/agent-logs` | List agent run logs | Yes |
| GET | `/api/mlops/stats` | Aggregated agent statistics | Yes |

## Project Structure

```
eipr-project/
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py              # POST /register, /login, /refresh, /me, PATCH /settings
│   │       ├── project.py           # CRUD: POST/GET/PATCH/DELETE projects and outputs
│   │       ├── agents.py            # Agent execution: opportunity, IP, business, report, export
│   │       └── mlops.py             # GET /events, /agent-logs, /stats
│   ├── agents/
│   │   ├── opportunity_scout/
│   │   │   └── agent.py             # Identifies 3-5 business opportunities with feasibility scoring
│   │   ├── ip_strategist/
│   │   │   └── agent.py             # Patent, trademark, trade secret, copyright analysis
│   │   ├── business_architect/
│   │   │   └── agent.py             # SWOC, Porter's 5 Forces, 4Ps, STP, UVP, growth strategy
│   │   ├── financial_analyst/
│   │   │   └── agent.py             # Cost, revenue, break-even, funding, metrics
│   │   └── pedagogical_synthesizer/
│   │       └── agent.py             # EIPR case study synthesis from all prior outputs
│   ├── core/
│   │   ├── config.py                # Pydantic Settings — reads from .env
│   │   ├── database.py              # SQLAlchemy engine, session, Base, get_db dependency
│   │   ├── security.py              # Password hashing, JWT create/decode, Fernet encryption
│   │   ├── llm_client.py            # Multi-provider LLM client with retry logic
│   │   ├── mcp_client.py            # MCP service wrappers (patent, trademark, market, business)
│   │   └── mlops.py                 # MLflowTracker, AgentMetrics, log_agent_run, log_mlops_event
│   ├── models/
│   │   ├── user.py                  # User(id, email, name, hashed_password, provider settings, api_keys)
│   │   ├── project.py               # Project(id, user_id, title, domain, input_text, status, stages)
│   │   └── mlops.py                 # MLOpsEvent, AgentRunLog
│   ├── services/
│   │   └── export_service.py        # generate_docx(), generate_pdf_html() with fallbacks
│   ├── scripts/
│   │   └── seed_demo.py             # Seeds demo user with fully populated sample project
│   ├── tests/
│   │   └── test_api.py              # 4 integration tests: health, register, login, create project
│   ├── main.py                      # FastAPI app, CORS, middleware, router registration
│   ├── .env                         # Environment variables (git-ignored)
│   ├── .env.example                 # Environment template with comments
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Multi-stage Docker build for backend
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Landing page with hero, features, CTA
│   │   ├── layout.tsx               # Root HTML layout with Providers wrapper
│   │   ├── providers.tsx            # ThemeProvider + QueryClientProvider
│   │   ├── auth/
│   │   │   ├── layout.tsx           # Two-column auth layout (branding + form)
│   │   │   ├── login/page.tsx       # Login form with error/loading states
│   │   │   └── register/page.tsx    # Register form with auto-login
│   │   └── (app)/
│   │       ├── layout.tsx           # Auth guard + Sidebar layout
│   │       ├── dashboard/page.tsx   # KPI cards, recent projects, agent stats
│   │       ├── projects/
│   │       │   ├── page.tsx         # Project list with search/filter
│   │       │   ├── new/page.tsx     # Create project with sample topics
│   │       │   └── [id]/page.tsx    # Full project detail with 5 stage tabs
│   │       └── settings/
│   │           ├── profile/page.tsx # User profile with account info
│   │           └── llm/page.tsx     # LLM provider config with test connection
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx          # Navigation sidebar with user menu
│   ├── services/
│   │   └── api.ts                   # Axios client with auth interceptor + API modules
│   ├── store/
│   │   ├── useAuthStore.ts          # Zustand auth store (persisted to localStorage)
│   │   └── useThemeStore.ts         # Theme state (dark mode)
│   ├── styles/
│   │   └── globals.css              # Tailwind directives + custom design system
│   ├── lib/
│   │   └── utils.ts                 # cn() classname utility
│   ├── package.json                 # Dependencies and scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind with brand color palette
│   ├── next.config.js               # Next.js standalone output config
│   └── Dockerfile                   # Multi-stage Docker build for frontend
├── docker-compose.yml               # All services: backend, frontend, ollama, mlflow, prometheus, grafana
├── Makefile                         # setup, dev, test, seed, clean, docker, mlops
├── start.sh                         # Dev startup script (backend + frontend)
├── AGENTS.md                        # AI coding agent context
└── README.md                        # This file
```

## Docker (Optional)

### Start all services (backend + frontend + infrastructure)

```bash
docker-compose up --build
```

### Start only monitoring stack

```bash
make mlops
# Starts: MLflow (:5000), Prometheus (:9090), Grafana (:3001)
```

### Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs |
| MLflow | http://localhost:5000 |
| Grafana | http://localhost:3001 (admin/admin) |
| Prometheus | http://localhost:9090 |

## Testing

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

The test suite covers:
- Health check endpoint
- User registration
- User login and token retrieval
- Project creation

Tests use the real SQLite database and run sequentially. Run `make clean` to reset the database between test runs.

## EIPR Curriculum Mapping

| Unit | Topic | Agent(s) | Key Outputs |
|------|-------|----------|-------------|
| I | Entrepreneurship Foundations | Opportunity Scout | Entrepreneurial mindset assessment, opportunity identification, risk evaluation |
| II | Entrepreneurial Process & Discovery | Opportunity Scout + Business Architect | Idea validation, market research, business model canvas, competitive analysis |
| III | Business Planning & Finance | Business Architect + Financial Analyst | Business plan, SWOC, Porter's Five Forces, 4Ps, STP, financial projections, funding strategy |
| IV | Intellectual Property Rights | IP Strategist | Patent landscape, trademark analysis, copyright, trade secrets, IP registration |
| V | IP Management & Strategy | IP Strategist + Pedagogical Synthesizer | IP portfolio strategy, freedom to operate, IP monetization, case study synthesis |

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Install backend Python + frontend npm dependencies |
| `make dev` | Start backend (:8000) and frontend (:3000) in background |
| `make test` | Run backend pytest suite |
| `make seed` | Seed demo user and sample project |
| `make clean` | Remove database, .next cache, __pycache__ directories |
| `make docker` | Build and start all Docker services |
| `make mlops` | Start MLflow, Prometheus, Grafana via Docker |

## Troubleshooting

### Backend won't start
- **Port 8000 in use:** `lsof -ti :8000 | xargs kill -9`
- **Python version too new:** Use Python 3.11 specifically. PyO3 (used by pydantic-core) doesn't support Python 3.14 yet.
- **Missing .env file:** Copy `.env.example` to `.env` and adjust values.
- **Database errors:** Delete `eipr_agent.db` and restart — tables are auto-created.

### Frontend won't start
- **Port 3000 in use:** Next.js auto-falls back to 3001. Check which port it actually started on.
- **Node version too old:** Upgrade to Node 18+.
- **Missing dependencies:** Run `npm install` again.

### Agent runs fail
- **Ollama not running:** Start Ollama with `ollama serve` and pull a model (`ollama pull llama3.2`).
- **LLM returns invalid JSON:** The agent includes fallback parsing. Check backend logs.
- **Rate limited:** Cloud providers may rate-limit. Add delays or switch to a different provider.

### Tests fail
- **Duplicate email error:** Clear the database with `make clean` or delete `eipr_agent.db`.
- **Database locked:** SQLite may lock if multiple processes access it. Kill other Python processes.

## License

MIT
