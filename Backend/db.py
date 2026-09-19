"""Database connection and table setup for the Tiger (TimescaleDB) instance."""
import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv()


@contextmanager
def db():
    conn = psycopg2.connect(
        host=os.environ["TIGER_HOST"],
        port=os.environ["TIGER_PORT"],
        dbname=os.environ["TIGER_DB"],
        user=os.environ["TIGER_USER"],
        password=os.environ["TIGER_PASSWORD"],
        sslmode="require",
    )
    try:
        yield conn
    finally:
        conn.close()


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS battle_records (
            id serial PRIMARY KEY,
            left_id text NOT NULL,
            right_id text NOT NULL,
            winner_id text NOT NULL,
            left_total integer NOT NULL,
            right_total integer NOT NULL,
            winner_share double precision NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS battle_records_created_idx
        ON battle_records (created_at DESC)
        """
    )
    conn.commit()
    cur.close()
