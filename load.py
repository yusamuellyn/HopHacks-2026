import duckdb, glob, getpass

password = getpass.getpass('Enter Tiger password: ')

con = duckdb.connect()
con.execute("INSTALL postgres; LOAD postgres;")
con.execute(f"ATTACH 'host=kgf657xncf.r07ck2lhzs.tsdb.cloud.timescale.com port=35586 dbname=tsdb user=tsdbadmin password={password} sslmode=require' AS tiger (TYPE postgres);")

files = sorted(glob.glob('twitter-firehose/tweets-000000.parquet'))
for f in files:
    print('Loading', f)
    con.execute(f'''
        INSERT INTO tiger.tweets_raw
        SELECT
            COALESCE(version, added_at, created_at) AS ts,
            id AS tweet_id,
            author_id,
            body AS text,
            created_at,
            lang AS language,
            reply_to_status_id,
            quoting_id,
            conversation_id,
            like_count,
            reply_count,
            retweet_count,
            quote_count,
            views_count AS view_count,
            bookmarks_count AS bookmark_count
        FROM read_parquet('{f}')
    ''')
    result = con.execute("SELECT count(*) FROM tiger.tweets_raw").fetchone()
    print('Total rows so far:', result[0])

print('Done')
