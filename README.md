# DariLik – AI-Powered Rental Matching Platform

> Built at a 48-hour hackathon to solve a real problem in Morocco's rental market.

## The Problem

Finding a trustworthy tenant in Morocco is largely guesswork. Landlords have no structured
way to evaluate applicants, and tenants with good profiles get overlooked because there's
no fair comparison system.

## What We Built

DariLik analyzes tenant profiles and scores them based on financial stability, employment
status, and compatibility with the listing. Landlords get a ranked shortlist instead of
a pile of unstructured applications — powered by Google Generative AI and Claude.

## My Contribution

I led the backend development end-to-end:
- Designed and implemented the **tenant scoring algorithm** — weighted criteria including
  income stability, rental history, and profile completeness
- Built the **FastAPI REST layer** that connects the frontend to the scoring engine
  and AI models
- Integrated **Google Generative AI and the Anthropic (Claude) API** for intelligent
  tenant evaluation and recommendations
- Managed **PostgreSQL database** schema, queries, and SQLAlchemy models
- Handled all data validation using Pydantic and connected the backend to the
  JavaScript frontend during the final hours of the hackathon

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python, FastAPI, SQLAlchemy             |
| AI       | Google Generative AI, Anthropic (Claude)|
| Database | PostgreSQL                              |
| Frontend | JavaScript, HTML, CSS                   |
| Other    | Pydantic, uvicorn, REST APIs, Git       |

## How to Run

```bash
# Clone the repo
git clone https://github.com/Bsara435/darilik-ai-platform.git
cd darilik-ai-platform

# Install dependencies
pip install -r requirements.txt

# Run the backend
cd backend
uvicorn main:app --reload

# Open the frontend
cd ../frontend
open index.html
```

## Features

- AI-powered tenant scoring using Google Generative AI and Claude
- Profile comparison across multiple applicants
- Data-driven recommendations for landlords
- Clean REST API built with FastAPI

## What I'd Improve With More Time

- Fine-tune the AI prompts with more real rental data from the Moroccan market
- Add landlord authentication and a proper dashboard
- Deploy the API and connect to real estate listing platforms

## Team

Built collaboratively at a 48-hour hackathon. My role: backend, FastAPI, AI integration,
database design, scoring logic.
