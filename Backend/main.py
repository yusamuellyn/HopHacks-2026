import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response 
from pydantic import BaseModel
import psycopg2
from dotenv import load_dotenv
from search_terms import MEME_SEARCH_TERMS
from elevenlabs.client import ElevenLabs
from pydantic import BaseModel 
import os


load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

elevenlabs_client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
VOICE_ID = os.environ["ELEVENLABS_VOICE_ID"]


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

def generate_speech(text: str) -> bytes:
    audio_stream = elevenlabs_client.text_to_speech.convert(
        text=text,
        voice_id=VOICE_ID,
        model_id="eleven_turbo_v2_5",  # low latency, good for live app feel
        output_format="mp3_44100_128",
    )
    return b"".join(audio_stream)


class PickRequest(BaseModel):
    memeName: str

class StartRequest(BaseModel):
    leftName: str
    rightName: str

class WinnerRequest(BaseModel):
    winnerName: str
    pct: int


@app.post("/api/announce-pick")
def announce_pick(payload: PickRequest):
    audio = generate_speech(payload.memeName.upper() + "!")
    return Response(content=audio, media_type="audio/mpeg")


@app.post("/api/announce-start")
def announce_start(payload: StartRequest):
    text = f"{payload.leftName} versus {payload.rightName}! Fight!"
    audio = generate_speech(text)
    return Response(content=audio, media_type="audio/mpeg")


@app.post("/api/announce-winner")
def announce_winner(payload: WinnerRequest):
    text = f"{payload.winnerName} wins! {payload.pct} percent meme dominance!"
    audio = generate_speech(text)
    return Response(content=audio, media_type="audio/mpeg")