"""Battle endpoints: stats, live battle lookup, and recording results."""
from fastapi import APIRouter, HTTPException

from db import db, ensure_tables
from models import BattleRequest, RecordBattleRequest
from queries import build_stats_payload, fetch_mention_stats, require_meme

router = APIRouter(prefix="/api")


@router.get("/stats")
def stats():
    with db() as conn:
        cur = conn.cursor()
        payload = build_stats_payload(cur)
        cur.close()
    return payload


@router.post("/battle")
def battle(payload: BattleRequest):
    left_id = require_meme(payload.leftId)
    right_id = require_meme(payload.rightId)
    if left_id == right_id:
        raise HTTPException(status_code=400, detail="Pick two different memes")

    with db() as conn:
        cur = conn.cursor()
        mention_stats, yesterday, latest = fetch_mention_stats(cur, [left_id, right_id])
        cur.close()

    left = mention_stats[left_id]
    right = mention_stats[right_id]
    left_total = left["totalMentions"]
    right_total = right["totalMentions"]
    total = left_total + right_total
    left_share = 50.0 if total == 0 else (left_total / total) * 100
    winner_id = left_id if left_total >= right_total else right_id

    return {
        "leftId": left_id,
        "rightId": right_id,
        "leftTotal": left_total,
        "rightTotal": right_total,
        "leftYesterday": left["yesterdayMentions"],
        "rightYesterday": right["yesterdayMentions"],
        "leftLatest": left["latestMentions"],
        "rightLatest": right["latestMentions"],
        "leftShare": left_share,
        "rightShare": 100.0 - left_share,
        "winnerId": winner_id,
        "window": {
            "yesterday": yesterday.isoformat() if yesterday else None,
            "latest": latest.isoformat() if latest else None,
        },
    }


@router.post("/record-battle")
def record_battle(payload: RecordBattleRequest):
    left_id = require_meme(payload.leftId)
    right_id = require_meme(payload.rightId)
    winner_id = require_meme(payload.winnerId)
    if winner_id not in (left_id, right_id):
        raise HTTPException(status_code=400, detail="Winner must be one of the fighters")

    with db() as conn:
        ensure_tables(conn)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO battle_records (
                left_id, right_id, winner_id, left_total, right_total, winner_share
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            [
                left_id,
                right_id,
                winner_id,
                int(payload.leftTotal),
                int(payload.rightTotal),
                float(payload.winnerShare),
            ],
        )
        conn.commit()
        stats_payload = build_stats_payload(cur)
        cur.close()
    return stats_payload
