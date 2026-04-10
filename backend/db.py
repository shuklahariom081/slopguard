"""
db.py — Supabase client
========================
Single shared Supabase client used across the app.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables. "
        "Copy .env.example to .env and fill in your Supabase credentials."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)