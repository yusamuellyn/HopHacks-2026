"""App entry point: creates the FastAPI app and wires up the route modules.

Run with: uvicorn main:app --reload
"""
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import announcer_routes
import battle_routes
from db import db, ensure_tables

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(battle_routes.router)
app.include_router(announcer_routes.router)


@app.on_event("startup")
def startup():
    with db() as conn:
        ensure_tables(conn)
