import os
import urllib.parse
from psycopg2 import pool
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "sparehub_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "sparehub_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "sparehub_secure_pass_2026")

_connection_pool = None

def get_connection_pool():
    global _connection_pool
    if _connection_pool is None:
        if DATABASE_URL:
            _connection_pool = pool.SimpleConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=DATABASE_URL
            )
        else:
            _connection_pool = pool.SimpleConnectionPool(
                minconn=1,
                maxconn=20,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                dbname=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD
            )
    return _connection_pool

@contextmanager
def get_db():
    conn_pool = get_connection_pool()
    conn = conn_pool.getconn()
    try:
        yield conn
    finally:
        conn_pool.putconn(conn)
