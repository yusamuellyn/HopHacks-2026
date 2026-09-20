# HopHacks-2026

MemeArena
Hackathon project with a FastAPI backend and a React (Vite) frontend.

**Live: [https://your-project.vercel.app](https://your-project.vercel.app)**

## Project structure
Backend/ FastAPI app (Python)
Frontend/ React app (Vite)


## Running the backend

```bash
cd Backend
python3 -m venv venv          # first time only
./venv/bin/pip install -r requirements.txt   # first time only
./venv/bin/uvicorn main:app --reload
```

The API runs at http://localhost:8000 (interactive docs at http://localhost:8000/docs).

## Running the frontend

```bash
cd Frontend
npm install                   # first time only
npm run dev
```

The app runs at http://localhost:5173. CORS is already configured on the backend to allow requests from the dev server.

## Deployment (Vercel)

Both frontend and backend deploy as a single Vercel project.

- **Frontend**: Vite app in `Frontend/`, auto-detected by Vercel.
- **Backend**: FastAPI app in `Backend/`, deployed as Vercel serverless functions. Needs a `vercel.json` routing API calls to the Python backend, and `Backend/main.py` should stay startup-light — the `@app.on_event("startup")` table creation should be run once manually against the database rather than relying on it firing per request.
- Set these environment variables in the Vercel project settings: `TIGER_HOST`, `TIGER_PORT`, `TIGER_DB`, `TIGER_USER`, `TIGER_PASSWORD`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `GEMINI_API_KEY`.
- Update CORS `allow_origins` from `"*"` to the deployed frontend URL once live.
- Database connections are opened per-request (`psycopg2.connect()` in `db()`) — fine for hackathon traffic, but watch Timescale's connection limit if traffic spikes, since each cold serverless invocation opens a new connection.
