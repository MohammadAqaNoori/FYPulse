"""
quick_scrape.py — FYPulse Multi-Source Data Pipeline
Scrapes from GitHub, Papers With Code, arXiv, Devpost, GitHub Topics, and Kaggle.
Run once after starting services:
    cd ml_service && py quick_scrape.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join("..", "backend", ".env"))

from scrapers.github_scraper import GitHubScraper
from scrapers.paperswithcode_scraper import PapersWithCodeScraper
from scrapers.arxiv_scraper import ArxivScraper
from scrapers.university_scraper import UniversityScraper
from scrapers.base_scraper import ScrapedProject
from pipelines.preprocessing import preprocess_batch
from pipelines.embedding_pipeline import EmbeddingPipeline
from datetime import datetime
from sqlalchemy import create_engine, text
import re

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"\n{'='*60}")
print("  FYPulse — Multi-Source Data Pipeline")
print(f"{'='*60}")
print(f"  DB: {DATABASE_URL}\n")


# ── Title deduplication fingerprint ──────────────────────────────────────────
def _fp(title: str) -> str:
    t = title.lower()
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    stop = {'the','a','an','for','with','using','based','project','system','app','application'}
    words = [w for w in t.split() if w not in stop and len(w) > 1]
    return " ".join(sorted(words[:5]))


all_raw: list[ScrapedProject] = []
seen_urls: set = set()
seen_fps:  set = set()

def _add(projects):
    added = 0
    for p in projects:
        if p.source_url in seen_urls:
            continue
        fp = _fp(p.title)
        if fp in seen_fps:
            continue
        seen_urls.add(p.source_url)
        seen_fps.add(fp)
        all_raw.append(p)
        added += 1
    return added


# ── 1. GitHub (advanced FYP-targeted queries) ─────────────────────────────────
print("[1/5] GitHub — advanced FYP queries...")
github = GitHubScraper()
n = _add(github.scrape_advanced_fyps(max_per_query=20))
print(f"      +{n} projects  (total: {len(all_raw)})")


# ── 2. Papers With Code ────────────────────────────────────────────────────────
print("[2/5] Papers With Code — research papers with code...")
try:
    pwc = PapersWithCodeScraper()
    n = _add(pwc.scrape_by_tasks(max_per_task=12))
    print(f"      +{n} projects  (total: {len(all_raw)})")
except Exception as e:
    print(f"      SKIPPED: {e}")


# ── 3. arXiv ──────────────────────────────────────────────────────────────────
print("[3/5] arXiv — cutting-edge CS research papers...")
try:
    arxiv = ArxivScraper()
    n = _add(arxiv.scrape_all_areas(max_per_query=20))
    print(f"      +{n} projects  (total: {len(all_raw)})")
except Exception as e:
    print(f"      SKIPPED: {e}")


# ── 4. University portals / Devpost / Kaggle ──────────────────────────────────
print("[4/5] University portals (Devpost, GitHub Topics, Kaggle)...")
try:
    uni = UniversityScraper()
    n = _add(uni.scrape("machine learning final year project", max_results=80))
    print(f"      +{n} projects  (total: {len(all_raw)})")
except Exception as e:
    print(f"      SKIPPED: {e}")


print(f"\n  Total unique projects collected: {len(all_raw)}")

if not all_raw:
    print("ERROR: No projects scraped. Check your internet connection.")
    sys.exit(1)


# ── 5. Preprocess + save JSON ──────────────────────────────────────────────────
print("\n[5/5] Preprocessing, saving, and building embeddings...")
processed = preprocess_batch(all_raw)
data = [p.__dict__ for p in processed]

os.makedirs("data/raw", exist_ok=True)
ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
path = os.path.join("data", "raw", f"multisource_{ts}.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"      Saved {len(data)} projects → {path}")


# ── Import into DB ────────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL)
inserted = 0

with engine.connect() as conn:
    conn.execute(text("DELETE FROM recommendations"))
    conn.execute(text("DELETE FROM projects"))
    conn.commit()

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


# ── Fit embeddings ─────────────────────────────────────────────────────────────
texts = [p.get("combined_text", p.get("title", "")) for p in data]
keys  = [p.get("source_url", str(i)) for i, p in enumerate(data)]

ep = EmbeddingPipeline()
ep.fit(texts, keys)
ep.save()
print(f"      TF-IDF fitted on {len(texts)} documents")

print(f"\n{'='*60}")
print(f"  DONE — {inserted} projects from 5 sources ready.")
print(f"  Sources: GitHub + Papers With Code + arXiv + Devpost + Kaggle")
print(f"  Refresh http://localhost:5173/recommendations")
print(f"{'='*60}\n")
