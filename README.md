# HopHacks-2026

MemeArena
Hackathon project with a FastAPI backend and a React (Vite) frontend.

## Project structure

```
Backend/    FastAPI app (Python)
Frontend/   React app (Vite)
```

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
