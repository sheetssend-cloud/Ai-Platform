
# Multi‑Agent AI Brainstorming (Dockerized)

## Quick Start
```bash
# in project root
cp backend/.env.example backend/.env   # set your OPENAI_API_KEY if available
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:8000

## Local Dev (without Docker)
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
