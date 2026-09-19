import duckdb, glob, getpass

password = getpass.getpass('Enter Tiger password: ')

con = duckdb.connect()
con.execute("INSTALL postgres; LOAD postgres;")
con.execute(f"ATTACH 'host=u15wiz130i.s5v9uxbkrv.tsdb.cloud.timescale.com port=32705 dbname=tsdb user=tsdbadmin password={password} sslmode=require' AS tiger (TYPE postgres);")

files = sorted(glob.glob('twitter-firehose/tweets-000000.parquet'))
for f in files:
    print('Loading', f)
    con.execute(f'''
        INSERT INTO tiger.tweets
        SELECT
            id,
            author_id,
            body,
            created_at,
            like_count,
            reply_count,
            retweet_count,
            quote_count,
            views_count,
            bookmarks_count,
            lang,
            source,
            reply_to_status_id,
            reply_to_user_id,
            conversation_id,
            quoting_id
        FROM read_parquet('{f}')
    ''')
    result = con.execute("SELECT count(*) FROM tiger.tweets").fetchone()
    print('Total rows so far:', result[0])

print('Done')
