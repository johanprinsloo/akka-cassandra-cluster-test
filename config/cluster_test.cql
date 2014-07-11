CREATE KEYSPACE IF NOT EXISTS "factorial" WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 };
USE factorial;
CREATE TABLE IF NOT EXISTS "results" (
  input int,
  status text,
  result text,
  calcTime double,
  PRIMARY KEY (input)
) WITH caching = 'all';