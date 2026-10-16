"""
seed_from_db.py
---------------
One-time script: reads all projects from the PostgreSQL DB and exports them
into ml_service/data/raw/ as JSON, then fits the TF-IDF embedding model.

Run once after the backend has projects in the DB:
    cd ml_service
    py seed_from_db.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))

# ── Load env ──────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fall back to backend .env
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
    DATABASE_URL = os.getenv("DATABASE_URL")

print(f"[seed] Using DB: {DATABASE_URL}")

# ── Read projects from DB ─────────────────────────────────────────────────────
from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT id, title, description, source_url, source_type,
               technologies, domains, difficulty_level, popularity_score
        FROM projects
        ORDER BY id
    """)).fetchall()

print(f"[seed] Found {len(rows)} projects in DB")

if not rows:
    print("[seed] No projects found. Scrape some data first via /api/v1/generator/scrape")
    sys.exit(0)

# ── Convert to ML format ──────────────────────────────────────────────────────
projects = []
for row in rows:
    title       = row[1] or ""
    description = row[2] or ""
    source_url  = row[3] or ""
    source_type = row[4] or ""
    technologies = row[5] if row[5] else []
    domains      = row[6] if row[6] else []
    difficulty   = row[7] or ""
    popularity   = float(row[8] or 0)

    combined_text = " ".join(filter(None, [
        title,
        description,
        " ".join(technologies),
        " ".join(domains),
        difficulty,
    ]))

    projects.append({
        "title":           title,
        "description":     description,
        "source_url":      source_url,
        "source_type":     source_type,
        "technologies":    technologies,
        "domains":         domains,
        "difficulty_level": difficulty,
        "popularity_score": popularity,
        "combined_text":   combined_text,
    })

# ── Save to data/raw ──────────────────────────────────────────────────────────
raw_dir = os.path.join(os.path.dirname(__file__), "data", "raw")
os.makedirs(raw_dir, exist_ok=True)

out_path = os.path.join(raw_dir, "db_seed.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print(f"[seed] Saved {len(projects)} projects → {out_path}")

# ── Fit embeddings ────────────────────────────────────────────────────────────
from pipelines.embedding_pipeline import EmbeddingPipeline

texts = [p["combined_text"] for p in projects]
keys  = [p["source_url"] or str(i) for i, p in enumerate(projects)]

print(f"[seed] Fitting TF-IDF on {len(texts)} documents...")
ep = EmbeddingPipeline()
ep.fit(texts, keys)
ep.save()

print("[seed] ✓ Embedding model fitted and saved.")
print(f"[seed] ML service is ready — {len(projects)} projects indexed.")
