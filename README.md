# DariLik – AI-Powered Rental Matching Platform

> Built at a 48-hour hackathon to solve a real problem in Morocco's rental market.

## The Problem

Finding a trustworthy tenant in Morocco is largely guesswork. Landlords have no structured
way to evaluate applicants, and tenants with good profiles get overlooked because there's
no fair comparison system.

## What We Built

DariLik analyzes tenant profiles and scores them based on financial stability, employment
status, and compatibility with the listing. Landlords get a ranked shortlist instead of
a pile of unstructured applications.

## My Contribution

I led the backend development end-to-end:
- Designed and implemented the **tenant scoring algorithm** (Python, SQL) — weighted
  criteria including income stability, rental history, and profile completeness
- Built the **REST API layer** that connects the frontend to the scoring engine
- Handled all **data processing and storage logic** for tenant profiles and listings
- Integrated the backend with the JavaScript frontend during the final hours of the hackathon

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Python, Flask, SQL      |
| Frontend | JavaScript, HTML, CSS   |
| Data     | SQLite / SQL queries    |
| Other    | REST APIs, Git          |

## How to Run

```bash
# Clone the repo
git clone https://github.com/Bsara435/darilik-ai-platform.git
cd darilik-ai-platform

# Install dependencies
pip install -r requirements.txt

# Run the backend
cd backend
python app.py

# Open the frontend
cd ../frontend
open index.html
```

## Features

- Tenant scoring system based on multiple weighted criteria
- Profile comparison across multiple applicants
- Data-driven recommendations for landlords
- Clean REST API consumed by the frontend

## What I'd Improve With More Time

- Replace rule-based scoring with an ML model trained on real rental data
- Add landlord authentication and a proper dashboard
- Connect to real estate listing platforms via external APIs

## Team

Built collaboratively at a hackathon. My role: backend, API design, scoring logic.
