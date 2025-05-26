import os
import random
import string
from flask import Flask, render_template, request, redirect, jsonify
from src.db import init_db, create_slug, get_target, increment_visits, get_stats
from dotenv import load_dotenv

# Load environment variables from .env (DATABASE_URL, BASE_URL, PORT, etc.)
load_dotenv()

# Read env vars
BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000').rstrip('/')
PORT     = int(os.getenv('PORT', 5000))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Initialize Flask and tell it where to find templates and static assets
app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_ROOT, 'templates'),
    static_folder=os.path.join(PROJECT_ROOT, 'static')
)

# Ensure the table is created before handling any requests
init_db()

@app.route('/')
def index():
    # Serve the main page (index.html) with the URL-shortening form
    return render_template('index.html')

@app.route('/api/shorten', methods=['POST'])
def shorten():
    # Grab the URL the user wants to shorten from their JSON body
    data = request.get_json() or {}
    long_url = data.get('url')
    if not long_url:
        # If missing, respond with a 400 and error message
        return jsonify(error='Missing URL'), 400

    # Generate and store a unique slug for this URL
    slug = create_slug(long_url)

    # Return the full short URL in JSON
    return jsonify(shortUrl=f"{BASE_URL}/{slug}"), 201

@app.route('/<slug>')
def lookup(slug):
    # Look up the original URL for the given slug (unless not found, in which it returns 404)
    target = get_target(slug)
    if not target:
        return "Not found", 404

    increment_visits(slug) # Increment the visit counter

    return redirect(target) # Redirect the client to the original long URL


@app.route('/api/stats/<slug>', methods=['GET'])
def stats(slug):
    """
    GET /api/stats/<slug>
    → Returns JSON { slug, visits, created_at } or 404 if unknown.
    """
    row = get_stats(slug)
    if not row:
        return jsonify(error='Not found'), 404

    visits, created_at = row
    return jsonify(
        slug=slug,
        visits=visits,
        created_at=created_at.isoformat()
    ), 200

@app.route('/creators')
def creators():
    return render_template('creators.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)