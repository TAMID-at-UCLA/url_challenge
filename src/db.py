import os, random, string
import psycopg2
from dotenv import load_dotenv
from psycopg2.pool import ThreadedConnectionPool

# Load environment variables from .env (so DATABASE_URL is set)
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Open a single global connection to the Postgres database
# autocommit=True means we don't have to call conn.commit() after each INSERT/UPDATE
# conn = psycopg2.connect(DATABASE_URL)
# conn.autocommit = True
# instead, create a pool of reusable connections


pool = ThreadedConnectionPool(minconn=1, maxconn=10, dsn=DATABASE_URL)

def with_conn(fn):
    """
    Simple decorator to handle database connections:
    1. Grab a connection from the pool.
    2. Give you a cursor to run your queries.
    3. Commit any changes.
    4. Return the connection back to the pool.
    """
    def wrapper(*args, **kwargs):
        # 1. Take a connection from the pool
        conn = pool.getconn()
        try:
            # 2. Open a cursor so we can talk to the database
            with conn.cursor() as cur:
                # Call your function with this cursor
                result = fn(cur, *args, **kwargs)
                # 3. Save changes (for INSERT/UPDATE)
                conn.commit()
                return result
        finally:
            # 4. Give the connection back when done
            pool.putconn(conn)
    return wrapper

@with_conn
def init_db(cur):
    """
    Create the `urls` table if it doesn't already exist.
    Reads and executes the SQL script in migrations/001_create_urls.sql.
    """
    cur.execute(open('migrations/001_create_urls.sql').read())

@with_conn
def create_slug(cur, target_url):
    """
    Return an existing slug for target_url if one exists;
    otherwise generate a new unique slug, store it, and return it.
    """

    # Option 1: Look for an existing row (checking if it's a duplicate)
    cur.execute("SELECT slug FROM urls WHERE target = %s", (target_url,))
    row = cur.fetchone()
    if row:
        return row[0]


    # Option 2: If no existing row exists matching the link, give a new slug/code
    while True:
        # Build a random 6-char string from letters+digits
        slug = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        cur.execute(
          "INSERT INTO urls (slug, target) VALUES (%s, %s) ON CONFLICT DO NOTHING",
          (slug, target_url)
        )
        if cur.rowcount:  # If rowcount is 1, the INSERT worked and we can return this slug
            return slug

@with_conn
def get_target(cur, slug):
    """Look up a slug and return its target URL string (or None if not found)."""
    cur.execute("SELECT target FROM urls WHERE slug = %s", (slug,))
    row = cur.fetchone()
    return row[0] if row else None

@with_conn
def increment_visits(cur, slug):
    """Increment the visit counter for a given slug by 1; updates the 'visits' column"""
    cur.execute(
        "UPDATE urls SET visits = visits + 1 WHERE slug = %s",
        (slug,)
    )

@with_conn
def get_stats(cur, slug):
    """
    Return (visits, created_at) for a given slug, or None if it doesn't exist.
    """
    cur.execute(
        "SELECT visits, created_at FROM urls WHERE slug = %s",
        (slug,)
    )
    return cur.fetchone()