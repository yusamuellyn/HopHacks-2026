import duckdb, glob

password = input('Enter Tiger password (visible): ')
print('You entered:', repr(password))

con = duckdb.connect()
con.execute("INSTALL postgres; LOAD postgres;")
con.execute(f"ATTACH 'host=kgf657xncf.r07ck2lhzs.tsdb.cloud.timescale.com port=35586 dbname=tsdb user=tsdbadmin password={password} sslmode=require' AS tiger (TYPE postgres);")
print('Connected successfully')
