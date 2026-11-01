"""
quick_scrape.py
Runs the full scrape + embed + DB import in one shot.
Designed to be run directly: py quick_scrape.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join("..", "backend", ".env"))

from scrapers.github_scraper import GitHubScraper
from pipelines.preprocessing import preprocess_batch
from pipelines.embedding_pipeline import EmbeddingPipeline
from datetime import datetime
from sqlalchemy import create_engine, text
import math

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"DB: {DATABASE_URL}")

# ── 1. Scrape ─────────────────────────────────────────────────────────────────
print("\n[1/3] Scraping GitHub for advanced FYP projects...")
scraper = GitHubScraper()
raw = scraper.scrape_advanced_fyps(max_per_query=20)
print(f"      Scraped {len(raw)} unique high-quality projects")

if not raw:
    print("ERROR: No projects scraped. Check network connection.")
    sys.exit(1)

# ── 2. Preprocess + save JSON ─────────────────────────────────────────────────
print("\n[2/3] Preprocessing and saving...")
processed = preprocess_batch(raw)

data = [p.__dict__ for p in processed]
os.makedirs("data/raw", exist_ok=True)
ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
path = os.path.join("data", "raw", f"github_{ts}.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"      Saved {len(data)} projects → {path}")

# ── 3. Import into DB ─────────────────────────────────────────────────────────
print("\n[3/3] Importing into database...")
engine = create_engine(DATABASE_URL)
inserted = skipped = 0

with engine.connect() as conn:
    conn.execute(text("DELETE FROM recommendations"))
    conn.execute(text("DELETE FROM projects"))
    conn.commit()
    print("      Cleared old projects")

    for p in data:
        source_url = p.get("source_url", "")
        if not source_url:
            continue

        techs  = p.get("technologies", [])
        domains = p.get("domains", [])
        if isinstance(techs, str):
            techs = [t.strip() for t in techs.split(",") if t.strip()]
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
            "title":            (p.get("title") or "Untitled")[:500],
            "description":      p.get("description") or "",
            "source_url":       source_url,
            "source_type":      p.get("source_type") or "github",
            "technologies":     techs,
            "domains":          domains,
            "difficulty_level": p.get("difficulty_level") or "intermediate",
            "popularity_score": float(p.get("popularity_score") or 0),
        })
        inserted += 1

    conn.commit()
print(f"      Inserted {inserted} projects into DB")

# ── 4. Fit embeddings ─────────────────────────────────────────────────────────
print("\n[4/4] Fitting TF-IDF embeddings...")
texts = [p.get("combined_text", p.get("title", "")) for p in data]
keys  = [p.get("source_url", str(i)) for i, p in enumerate(data)]

ep = EmbeddingPipeline()
ep.fit(texts, keys)
ep.save()
print(f"      Embeddings fitted on {len(texts)} documents")

print("\n" + "="*60)
print(f"  DONE — {inserted} projects indexed and ready.")
print("  Go to http://localhost:5173/recommendations and refresh.")
print("="*60)
