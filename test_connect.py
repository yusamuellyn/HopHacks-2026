import duckdb, glob

password = input('Enter Tiger password (visible): ')
print('You entered:', repr(password))

con = duckdb.connect()
con.execute("INSTALL postgres; LOAD postgres;")
con.execute(f"ATTACH 'host=u15wiz130i.s5v9uxbkrv.tsdb.cloud.timescale.com port=32705 dbname=tsdb user=tsdbadmin password={password} sslmode=require' AS tiger (TYPE postgres);")
print('Connected successfully')
