import os, random, string
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env (so DATABASE_URL is set)
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Open a single global connection to the Postgres database
# autocommit=True means we don't have to call conn.commit() after each INSERT/UPDATE
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True

def init_db():
    """
    Create the `urls` table if it doesn't already exist.
    Reads and executes the SQL script in migrations/001_create_urls.sql.
    """
    with conn.cursor() as cur:
        cur.execute(open('migrations/001_create_urls.sql').read())

def create_slug(target_url):
    """
    Generate a unique 6-character slug and store it with its target URL.
    - Tries random slugs until an INSERT succeeds (ON CONFLICT DO NOTHING avoids duplicates).
    - Returns the slug string on success.
    """
    while True:
        # Build a random 6-char string from letters+digits
        slug = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        with conn.cursor() as cur:
            cur.execute(
              "INSERT INTO urls (slug, target) VALUES (%s, %s) ON CONFLICT DO NOTHING",
              (slug, target_url)
            )
            if cur.rowcount:  # If rowcount is 1, the INSERT worked and we can return this slug
                return slug

def get_target(slug):
    """Look up a slug and return its target URL string (or None if not found)."""
    with conn.cursor() as cur:
        cur.execute("SELECT target FROM urls WHERE slug = %s", (slug,))
        row = cur.fetchone()
    return row[0] if row else None


def increment_visits(slug):
    """Increment the visit counter for a given slug by 1; updates the 'visits' column"""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE urls SET visits = visits + 1 WHERE slug = %s",
            (slug,)
        )