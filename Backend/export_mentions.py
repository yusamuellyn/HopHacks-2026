import os
import sys
import csv
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

def main(left_id, right_id):
    left_terms = MEME_SEARCH_TERMS.get(left_id)
    right_terms = MEME_SEARCH_TERMS.get(right_id)

    if not left_terms or not right_terms:
        raise ValueError(f"Unknown meme id(s): {left_id}, {right_id}")

    conn = get_conn()
    cur = conn.cursor()

    # Reads the precomputed meme_mentions table (see build_mentions.py)
    # instead of ILIKE-scanning the full tweets table.
    query = """
        SELECT
            tweet_id,
            body AS text,
            created_at AS ts,
            meme_id
        FROM meme_mentions
        WHERE meme_id IN (%s, %s)
        ORDER BY created_at
    """

    cur.execute(query, [left_id, right_id])
    rows = cur.fetchall()

    out_path = f"mentions_{left_id}_vs_{right_id}.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["tweet_id", "text", "ts", "meme_id"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python export_mentions.py <left_id> <right_id>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])