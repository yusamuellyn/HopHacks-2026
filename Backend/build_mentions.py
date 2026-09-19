"""One-shot build of the meme_mentions table.

Scans the full tweets table ONCE for all memes in MEME_SEARCH_TERMS and
stores every matching tweet in meme_mentions. Battle queries then read the
small precomputed table instead of ILIKE-scanning 29M rows per request.

Re-run this after loading more parquet files into tweets (it rebuilds
from scratch, so it never double-counts).
"""
import os
import time
import psycopg2
from dotenv import load_dotenv
from search_terms import MEME_SEARCH_TERMS

load_dotenv()


def get_conn():
    return psycopg2.connect(
        host=os.environ["TIGER_HOST"],
        port=os.environ["TIGER_PORT"],
        dbname=os.environ["TIGER_DB"],
        user=os.environ["TIGER_USER"],
        password=os.environ["TIGER_PASSWORD"],
        sslmode="require",
    )


def main():
    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout = 0")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS meme_mentions (
            meme_id    text NOT NULL,
            tweet_id   text NOT NULL,
            created_at timestamptz,
            body       text,
            PRIMARY KEY (meme_id, tweet_id)
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS meme_mentions_meme_time_idx
        ON meme_mentions (meme_id, created_at)
    """)

    # (meme_id, %pattern%) pairs for every search term of every meme
    pairs = [
        (meme_id, f"%{term}%")
        for meme_id, terms in MEME_SEARCH_TERMS.items()
        for term in terms
    ]
    values_sql = ", ".join(["(%s, %s)"] * len(pairs))
    params = [x for pair in pairs for x in pair]

    print(f"Rebuilding meme_mentions from {len(pairs)} search patterns "
          f"across {len(MEME_SEARCH_TERMS)} memes...")
    print("This does one full scan of the tweets table; expect several minutes.")

    start = time.time()
    cur.execute("TRUNCATE meme_mentions")
    # GROUP BY dedupes engagement-snapshot rows (same tweet id appears
    # multiple times in tweets) and tweets matching several terms of a meme.
    cur.execute(f"""
        INSERT INTO meme_mentions (meme_id, tweet_id, created_at, body)
        SELECT tm.meme_id, t.id, min(t.created_at), min(t.body)
        FROM tweets t
        JOIN (VALUES {values_sql}) AS tm (meme_id, pattern)
          ON t.body ILIKE tm.pattern
        GROUP BY tm.meme_id, t.id
    """, params)
    print(f"Done in {time.time() - start:.0f}s")

    cur.execute("""
        SELECT meme_id, count(*) FROM meme_mentions
        GROUP BY meme_id ORDER BY count(*) DESC
    """)
    print("\nMentions per meme:")
    for meme_id, n in cur.fetchall():
        print(f"  {meme_id:24s} {n:>8,}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
