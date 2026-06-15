# AGENTS.md — AI Coding Agent Context

## Project Overview

Multi-agent AI system for Entrepreneurship & IP Rights (EIPR) analysis. Backend is Python/FastAPI, frontend is Next.js 14/TypeScript.

## Key Conventions

- **Python**: 3.11+. Virtual env at `backend/.venv/`. Use `.venv/bin/python` for scripts.
- **Node**: 18+. Frontend in `frontend/`.
- **Database**: SQLite by default. SQLAlchemy ORM. Models in `backend/models/`.
- **Auth**: JWT (access + refresh tokens). Zustand persist on frontend. `eipr-auth-storage` localStorage key.
- **LLM**: Multi-provider client in `core/llm_client.py`. Default is Ollama (local). User settings in DB.
- **CSS**: Tailwind + custom design system in `frontend/styles/globals.css`. No CSS modules or styled-components.
- **State**: Zustand stores in `frontend/store/`. `useAuthStore` handles auth state.
- **API client**: Axios in `frontend/services/api.ts`. Auth interceptor reads from localStorage.
- **Agents**: 5 agents in `backend/agents/`. Each has `agent.py` with a runner function. All async.
- **Encryption**: Fernet (via `cryptography`). Key derived from `ENCRYPTION_KEY` via SHA256 + base64.

## Common Tasks

### Adding a new API endpoint
1. Add route in `backend/api/routes/` (or create new file)
2. Register router in `backend/main.py`
3. Add frontend API call in `frontend/services/api.ts`

### Adding a new DB model
1. Create model in `backend/models/`
2. Add relationship if needed
3. Run backend — SQLAlchemy creates tables automatically via `Base.metadata.create_all()`

### Adding a new agent
1. Create directory `backend/agents/<name>/`
2. Create `__init__.py` and `agent.py` with async runner function
3. Export in `backend/agents/__init__.py`
4. Add route in `backend/api/routes/agents.py`

### Running tests
```bash
cd backend && .venv/bin/python -m pytest tests/ -v
```

### Starting dev servers
```bash
# Backend
cd backend && .venv/bin/uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## Design Context

PRODUCT.md and DESIGN.md define the design system. Read them before any frontend work.
- **Register**: Product (app UI). Primary is the authenticated app shell (dashboard, projects, settings).
- **Brand personality**: Precise · Intelligent · Confident
- **Color strategy**: Dark theme with amber/gold accent (`#eab308`). Brand colors in `tailwind.config.js` as `brand-*` scale. CSS vars in `frontend/styles/globals.css`.
- **Typography**: Single Inter stack. Hierarchy via weight/size, not font swaps.
- **Anti-references**: No chatbot UI, glassmorphism, gradient text, side-stripe borders, numbered section markers, or tracked eyebrow labels.
- **Elevation**: Flat at rest, shadow on hover. Depth via background tone, not shadows.
- **North Star**: "The Lab Notebook" — scholarly, focused, content-forward.

## Architecture Notes

- `backend/core/mcp_client.py` has placeholder MCP URLs — swap with real services in production
- `backend/core/mlops.py` conditionally enables MLflow based on `ENABLE_MLFLOW` env var
- Export service (`backend/services/export_service.py`) uses lazy imports for optional deps (python-docx, weasyprint)
- Frontend `services/api.ts` redirects to `/auth/login` on 401 responses
