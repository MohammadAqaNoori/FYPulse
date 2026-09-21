# FYPulse 🎓

> Smart FYP Idea Discovery & Recommendation Platform

FYPulse helps students find, compare, and generate Final Year Project ideas by combining intelligent web data collection with ML-powered recommendations tailored to their skills and interests.

---

## Core Features

- **Smart Recommendations** — Match FYP ideas to student profiles using ML/NLP
- **Similarity Detection** — Detect overused ideas and suggest improvements
- **Idea Generator** — Generate novel project concepts from existing trends
- **Multi-source Collection** — GitHub, university websites, research portals
- **Match Breakdown** — Explain *why* a project matches a student's profile

---

## Project Structure

```
FYPulse/
├── frontend/          # React + TypeScript (Vite) — UI layer
├── backend/           # FastAPI (Python) — REST API & business logic
├── ml_service/        # Python ML/NLP service — pipelines, scrapers, models
├── docs/              # Architecture, API docs, ML docs
└── docker-compose.yml # Local orchestration
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React, TypeScript, Vite, TailwindCSS, Redux     |
| Backend    | FastAPI, Python, PostgreSQL, Redis              |
| ML Service | Python, HuggingFace, scikit-learn, FAISS        |
| Scraping   | BeautifulSoup, Scrapy, GitHub API               |
| DevOps     | Docker, Docker Compose                          |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose

### Run with Docker
```bash
docker-compose up --build
```

### Run individually
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# ML Service
cd ml_service && pip install -r requirements.txt && uvicorn main:app --port 8001 --reload
```

---

## Team

| Role              | Responsibility                          |
|-------------------|-----------------------------------------|
| Frontend Dev      | UI/UX, React components, API integration|
| Backend + ML Dev  | API, database, ML pipelines, scrapers   |
