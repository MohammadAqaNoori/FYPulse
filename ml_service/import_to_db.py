"""
import_to_db.py
---------------
Reads all JSON files from data/raw/ and inserts them into the backend
PostgreSQL database (projects table), skipping duplicates by source_url.

Run after scraping:
    cd ml_service
    py import_to_db.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"[import] Connecting to: {DATABASE_URL}")

from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL)

raw_dir = os.path.join(os.path.dirname(__file__), "data", "raw")
if not os.path.exists(raw_dir):
    print("[import] No data/raw directory found. Run scraping first.")
    sys.exit(0)

# Load all JSON files
all_projects = []
for fname in sorted(os.listdir(raw_dir)):
    if not fname.endswith(".json"):
        continue
    with open(os.path.join(raw_dir, fname), "r", encoding="utf-8") as f:
        data = json.load(f)
        all_projects.extend(data)

print(f"[import] Loaded {len(all_projects)} raw projects from JSON")

# Deduplicate by source_url
seen_urls = set()
unique = []
for p in all_projects:
    url = p.get("source_url", "")
    if url and url not in seen_urls:
        seen_urls.add(url)
        unique.append(p)

print(f"[import] {len(unique)} unique projects after dedup")

inserted = 0
skipped = 0

with engine.connect() as conn:
    for p in unique:
        source_url = p.get("source_url", "")

        # Skip if already in DB
        exists = conn.execute(
            text("SELECT 1 FROM projects WHERE source_url = :url"),
            {"url": source_url}
        ).fetchone()

        if exists:
            skipped += 1
            continue

        # Pull fields from the scraped data
        technologies = p.get("technologies", [])
        domains      = p.get("domains", [])
        if isinstance(technologies, str):
            technologies = [t.strip() for t in technologies.split(",") if t.strip()]
        if isinstance(domains, str):
            domains = [d.strip() for d in domains.split(",") if d.strip()]

        conn.execute(text("""
            INSERT INTO projects
              (title, description, source_url, source_type,
               technologies, domains, difficulty_level,
               popularity_score, similarity_count, created_at)
            VALUES
              (:title, :description, :source_url, :source_type,
               :technologies, :domains, :difficulty_level,
               :popularity_score, 0, NOW())
        """), {
            "title":           (p.get("title") or "Untitled")[:500],
            "description":     p.get("description") or "",
            "source_url":      source_url,
            "source_type":     p.get("source_type") or "github",
            "technologies":    technologies,
            "domains":         domains,
            "difficulty_level": p.get("difficulty_level") or None,
            "popularity_score": float(p.get("popularity_score") or p.get("stars") or 0),
        })
        inserted += 1

    conn.commit()

print(f"[import] ✓ Inserted {inserted} new projects, skipped {skipped} duplicates.")
print("[import] Done. Refresh the frontend to see projects and recommendations.")
