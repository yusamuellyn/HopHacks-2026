import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from dotenv import load_dotenv
from search_terms import MEME_SEARCH_TERMS


load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class BattleRequest(BaseModel):
    leftId: str
    rightId: str

def get_conn():
    return psycopg2.connect(
        host=os.environ["TIGER_HOST"],
        port=os.environ["TIGER_PORT"],
        dbname=os.environ["TIGER_DB"],
        user=os.environ["TIGER_USER"],
        password=os.environ["TIGER_PASSWORD"],
        sslmode="require",
    )



@app.post("/api/battle")
def battle(payload: BattleRequest):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT meme_id, count(*)
        FROM meme_mentions
        WHERE meme_id IN (%s, %s)
        GROUP BY meme_id
    """, [payload.leftId, payload.rightId])

    counts = dict(cur.fetchall())
    cur.close()
    conn.close()

    left_total = counts.get(payload.leftId, 0)
    right_total = counts.get(payload.rightId, 0)
    winner = payload.leftId if left_total >= right_total else payload.rightId

    return {
        "leftTotal": left_total,
        "rightTotal": right_total,
        "winnerId": winner,
    }