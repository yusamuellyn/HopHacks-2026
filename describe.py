import duckdb
print(duckdb.sql("DESCRIBE SELECT * FROM read_parquet('twitter-firehose/tweets-000000.parquet')"))
