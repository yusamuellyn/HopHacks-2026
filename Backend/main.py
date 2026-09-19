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
    left_terms = MEME_SEARCH_TERMS.get(payload.leftId)
    right_terms = MEME_SEARCH_TERMS.get(payload.rightId)

    if not left_terms or not right_terms:
        raise HTTPException(status_code=400, detail="Unknown meme id")

    conn = get_conn()
    cur = conn.cursor()

    left_conditions = " OR ".join(["text ILIKE %s"] * len(left_terms))
    right_conditions = " OR ".join(["text ILIKE %s"] * len(right_terms))

    cur.execute(f"""
        SELECT
            count(DISTINCT tweet_id) FILTER (WHERE {left_conditions}) AS left_total,
            count(DISTINCT tweet_id) FILTER (WHERE {right_conditions}) AS right_total
        FROM tweets_raw
    """, [f"%{t}%" for t in left_terms] + [f"%{t}%" for t in right_terms])

    left_total, right_total = cur.fetchone()
    cur.close()
    conn.close()

    winner = payload.leftId if left_total >= right_total else payload.rightId

    return {
        "leftTotal": left_total,
        "rightTotal": right_total,
        "winnerId": winner,
    }