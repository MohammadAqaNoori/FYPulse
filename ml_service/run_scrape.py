"""
run_scrape.py
Triggers the full advanced FYP scrape, waits for completion,
imports results into DB, and rebuilds embeddings.

Run once after starting the services:
    cd ml_service
    py run_scrape.py
"""
import requests
import time
import subprocess
import sys
import os

ML_BASE = "http://localhost:8001"

print("=" * 60)
print("  FYPulse — Full Data Pipeline")
print("=" * 60)

# Step 1: trigger scrape
print("\n[1/3] Triggering advanced GitHub scrape...")
try:
    r = requests.post(
        f"{ML_BASE}/ml/scrape",
        json={"source": "github", "query": "final year project", "max_results": 25},
        timeout=10
    )
    print("      Response:", r.json())
except Exception as e:
    print(f"      ERROR: {e}")
    print("      Is the ML service running on port 8001?")
    sys.exit(1)

# Step 2: poll until done
print("\n[2/3] Waiting for scrape to finish (this takes ~5-8 min)...")
prev_count = 0
stable_rounds = 0

for i in range(80):
    time.sleep(30)
    try:
        s = requests.get(f"{ML_BASE}/ml/status", timeout=5).json()
        count = s.get("total_indexed_projects", 0)
        files = s.get("raw_data_files", 0)
        elapsed = (i + 1) * 30
        print(f"      [{elapsed}s] projects={count}  files={files}")

        if count == prev_count and count > 100:
            stable_rounds += 1
            if stable_rounds >= 3:
                print("      Scrape appears complete (count stable).")
                break
        else:
            stable_rounds = 0
        prev_count = count

    except Exception as e:
        print(f"      Status check failed: {e}")

# Step 3: import to DB + rebuild embeddings
print("\n[3/3] Importing projects into DB and rebuilding embeddings...")
script_dir = os.path.dirname(os.path.abspath(__file__))

result = subprocess.run(
    [sys.executable, "import_to_db.py"],
    cwd=script_dir, capture_output=True, text=True
)
print(result.stdout)
if result.returncode != 0:
    print("ERROR:", result.stderr)

result = subprocess.run(
    [sys.executable, "seed_from_db.py"],
    cwd=script_dir, capture_output=True, text=True
)
print(result.stdout)
if result.returncode != 0:
    print("ERROR:", result.stderr)

print("\n" + "=" * 60)
print("  Pipeline complete! Refresh recommendations in the browser.")
print("=" * 60)
