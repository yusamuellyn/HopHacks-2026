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

    left_conditions = " OR ".join(["text ILIKE %s"] * len(left_terms))
    right_conditions = " OR ".join(["text ILIKE %s"] * len(right_terms))

    query = f"""
        SELECT
            tweet_id,
            text,
            ts,
            CASE
                WHEN {left_conditions} THEN %s
                WHEN {right_conditions} THEN %s
            END AS meme_id
        FROM tweets_raw
        WHERE {left_conditions} OR {right_conditions}
    """

    params = (
        [f"%{t}%" for t in left_terms]
        + [f"%{t}%" for t in right_terms]
        + [left_id, right_id]
        + [f"%{t}%" for t in left_terms]
        + [f"%{t}%" for t in right_terms]
    )

    cur.execute(query, params)
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