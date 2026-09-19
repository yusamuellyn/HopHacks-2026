"""SQL queries for mention stats and battle records (logic unchanged from main.py)."""
from datetime import date, timedelta

from fastapi import HTTPException

from search_terms import MEME_SEARCH_TERMS


def require_meme(meme_id: str) -> str:
    if meme_id not in MEME_SEARCH_TERMS:
        raise HTTPException(status_code=400, detail=f"Unknown meme id: {meme_id}")
    return meme_id


def mention_window(cur):
    cur.execute("SELECT max(created_at)::date FROM meme_mentions")
    latest = cur.fetchone()[0]
    if latest is None:
        return None, None
    return latest - timedelta(days=1), latest


def fetch_mention_stats(cur, meme_ids):
    yesterday, latest = mention_window(cur)
    stats = {
        meme_id: {"yesterdayMentions": 0, "latestMentions": 0, "totalMentions": 0}
        for meme_id in meme_ids
    }
    if not meme_ids:
        return stats, yesterday, latest
    cur.execute(
        """
        WITH bounds AS (
            SELECT max(created_at)::date AS latest FROM meme_mentions
        )
        SELECT
            meme_id,
            count(*) FILTER (
                WHERE created_at::date = (SELECT latest FROM bounds) - 1
            ) AS yesterday,
            count(*) FILTER (
                WHERE created_at::date = (SELECT latest FROM bounds)
            ) AS latest,
            count(*) AS total
        FROM meme_mentions
        WHERE meme_id = ANY(%s)
        GROUP BY meme_id
        """,
        [list(meme_ids)],
    )
    for meme_id, yday, latest_count, total in cur.fetchall():
        stats[meme_id] = {
            "yesterdayMentions": int(yday or 0),
            "latestMentions": int(latest_count or 0),
            "totalMentions": int(total or 0),
        }
    return stats, yesterday, latest


def fetch_records(cur):
    cur.execute("SELECT count(*) FROM battle_records")
    battles = int(cur.fetchone()[0])
    cur.execute(
        """
        SELECT winner_id
        FROM battle_records
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """
    )
    last_row = cur.fetchone()
    last_champion = last_row[0] if last_row else None

    fighters = {
        meme_id: {"wins": 0, "losses": 0, "lastShare": None}
        for meme_id in MEME_SEARCH_TERMS
    }
    cur.execute(
        """
        SELECT
            meme_id,
            sum(wins)::int AS wins,
            sum(losses)::int AS losses
        FROM (
            SELECT
                left_id AS meme_id,
                CASE WHEN winner_id = left_id THEN 1 ELSE 0 END AS wins,
                CASE WHEN winner_id = left_id THEN 0 ELSE 1 END AS losses
            FROM battle_records
            UNION ALL
            SELECT
                right_id,
                CASE WHEN winner_id = right_id THEN 1 ELSE 0 END,
                CASE WHEN winner_id = right_id THEN 0 ELSE 1 END
            FROM battle_records
        ) scored
        GROUP BY meme_id
        """
    )
    for meme_id, wins, losses in cur.fetchall():
        if meme_id not in fighters:
            fighters[meme_id] = {"wins": 0, "losses": 0, "lastShare": None}
        fighters[meme_id]["wins"] = int(wins or 0)
        fighters[meme_id]["losses"] = int(losses or 0)

    cur.execute(
        """
        SELECT meme_id, share
        FROM (
            SELECT
                meme_id,
                share,
                row_number() OVER (
                    PARTITION BY meme_id ORDER BY created_at DESC, id DESC
                ) AS rn
            FROM (
                SELECT
                    left_id AS meme_id,
                    CASE WHEN winner_id = left_id THEN winner_share ELSE 100 - winner_share END AS share,
                    created_at,
                    id
                FROM battle_records
                UNION ALL
                SELECT
                    right_id,
                    CASE WHEN winner_id = right_id THEN winner_share ELSE 100 - winner_share END,
                    created_at,
                    id
                FROM battle_records
            ) all_fights
        ) ranked
        WHERE rn = 1
        """
    )
    for meme_id, share in cur.fetchall():
        if meme_id in fighters:
            fighters[meme_id]["lastShare"] = float(share)

    today = date.today().isoformat()
    cur.execute(
        """
        SELECT winner_id, count(*)
        FROM battle_records
        WHERE created_at::date = CURRENT_DATE
        GROUP BY winner_id
        """
    )
    daily_wins = {meme_id: int(n) for meme_id, n in cur.fetchall()}
    cur.execute(
        "SELECT count(*) FROM battle_records WHERE created_at::date = CURRENT_DATE"
    )
    daily_battles = int(cur.fetchone()[0])

    cur.execute(
        """
        SELECT id, left_id, right_id, winner_id, left_total, right_total, winner_share, created_at
        FROM battle_records
        ORDER BY created_at DESC, id DESC
        LIMIT 12
        """
    )
    recent = [
        {
            "id": row[0],
            "leftId": row[1],
            "rightId": row[2],
            "winnerId": row[3],
            "leftTotal": int(row[4]),
            "rightTotal": int(row[5]),
            "winnerShare": float(row[6]),
            "createdAt": row[7].isoformat() if row[7] else None,
        }
        for row in cur.fetchall()
    ]

    return {
        "battles": battles,
        "lastChampionId": last_champion,
        "fighters": fighters,
        "daily": {"date": today, "wins": daily_wins, "battles": daily_battles},
        "recent": recent,
    }


def build_stats_payload(cur):
    mention_stats, yesterday, latest = fetch_mention_stats(cur, list(MEME_SEARCH_TERMS))
    records = fetch_records(cur)
    fighters = {}
    max_yesterday = 0
    for meme_id in MEME_SEARCH_TERMS:
        mentions = mention_stats.get(meme_id, {})
        record = records["fighters"].get(meme_id, {"wins": 0, "losses": 0, "lastShare": None})
        yday = int(mentions.get("yesterdayMentions") or 0)
        max_yesterday = max(max_yesterday, yday)
        fighters[meme_id] = {
            **record,
            "yesterdayMentions": yday,
            "latestMentions": int(mentions.get("latestMentions") or 0),
            "totalMentions": int(mentions.get("totalMentions") or 0),
        }
    return {
        "battles": records["battles"],
        "lastChampionId": records["lastChampionId"],
        "fighters": fighters,
        "daily": records["daily"],
        "recent": records["recent"],
        "window": {
            "yesterday": yesterday.isoformat() if yesterday else None,
            "latest": latest.isoformat() if latest else None,
        },
        "maxYesterday": max_yesterday,
    }
