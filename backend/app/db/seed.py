"""
Load believable Casablanca-area tenant profiles (MAD, mixed employment, payers).

Run from backend/ (with venv active):

    python -m app.db.seed

Requires DATABASE_URL in .env. Idempotent: replaces all rows in `tenants`.
"""

from __future__ import annotations

import sys

from sqlalchemy import delete
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.tenant import EmploymentType, Tenant

# Names use typical Moroccan given names; gender is implied by name choice (no mismatched labels).
_FAKE_TENANTS: list[dict] = [
    {
        "full_name": "Youssef Amrani",
        "age": 29,
        "monthly_income": 9_500,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 42,
        "target_rent": 4_200,
        "total_payments": 36,
        "on_time_payments": 34,
        "late_payments": 2,
        "previous_rentals_count": 2,
        "average_stay_months": 22.0,
    },
    {
        "full_name": "Salma Bennani",
        "age": 27,
        "monthly_income": 11_000,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 38,
        "target_rent": 5_200,
        "total_payments": 24,
        "on_time_payments": 24,
        "late_payments": 0,
        "previous_rentals_count": 1,
        "average_stay_months": 18.0,
    },
    {
        "full_name": "Mehdi Chraibi",
        "age": 34,
        "monthly_income": 7_200,
        "employment_type": EmploymentType.FREELANCER,
        "employment_duration_months": 56,
        "target_rent": 3_800,
        "total_payments": 18,
        "on_time_payments": 14,
        "late_payments": 4,
        "previous_rentals_count": 4,
        "average_stay_months": 14.0,
    },
    {
        "full_name": "Hanae El Fassi",
        "age": 21,
        "monthly_income": 2_200,
        "employment_type": EmploymentType.STUDENT,
        "employment_duration_months": 8,
        "target_rent": 2_800,
        "total_payments": 10,
        "on_time_payments": 8,
        "late_payments": 2,
        "previous_rentals_count": 1,
        "average_stay_months": 8.0,
    },
    {
        "full_name": "Omar Tazi",
        "age": 41,
        "monthly_income": 16_500,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 120,
        "target_rent": 6_500,
        "total_payments": 48,
        "on_time_payments": 47,
        "late_payments": 1,
        "previous_rentals_count": 3,
        "average_stay_months": 28.0,
    },
    {
        "full_name": "Kenza Idrissi",
        "age": 26,
        "monthly_income": 7_800,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 20,
        "target_rent": 4_000,
        "total_payments": 30,
        "on_time_payments": 29,
        "late_payments": 1,
        "previous_rentals_count": 2,
        "average_stay_months": 16.5,
    },
    {
        "full_name": "Karim Benjelloun",
        "age": 32,
        "monthly_income": 5_500,
        "employment_type": EmploymentType.FREELANCER,
        "employment_duration_months": 40,
        "target_rent": 4_500,
        "total_payments": 20,
        "on_time_payments": 11,
        "late_payments": 9,
        "previous_rentals_count": 5,
        "average_stay_months": 9.0,
    },
    {
        "full_name": "Imane Alaoui",
        "age": 30,
        "monthly_income": 9_200,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 72,
        "target_rent": 4_800,
        "total_payments": 40,
        "on_time_payments": 38,
        "late_payments": 2,
        "previous_rentals_count": 2,
        "average_stay_months": 31.0,
    },
    {
        "full_name": "Amine Filali",
        "age": 23,
        "monthly_income": 3_500,
        "employment_type": EmploymentType.STUDENT,
        "employment_duration_months": 6,
        "target_rent": 2_600,
        "total_payments": 6,
        "on_time_payments": 5,
        "late_payments": 1,
        "previous_rentals_count": 0,
        "average_stay_months": 6.0,
    },
    {
        "full_name": "Nadia Mansouri",
        "age": 38,
        "monthly_income": 13_500,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 96,
        "target_rent": 5_800,
        "total_payments": 36,
        "on_time_payments": 36,
        "late_payments": 0,
        "previous_rentals_count": 2,
        "average_stay_months": 36.0,
    },
    {
        "full_name": "Reda Ouazzani",
        "age": 44,
        "monthly_income": 1_800,
        "employment_type": EmploymentType.UNEMPLOYED,
        "employment_duration_months": 0,
        "target_rent": 3_200,
        "total_payments": 12,
        "on_time_payments": 4,
        "late_payments": 8,
        "previous_rentals_count": 6,
        "average_stay_months": 7.0,
    },
    {
        "full_name": "Yasmine Lahsen",
        "age": 28,
        "monthly_income": 8_800,
        "employment_type": EmploymentType.FREELANCER,
        "employment_duration_months": 48,
        "target_rent": 3_900,
        "total_payments": 22,
        "on_time_payments": 20,
        "late_payments": 2,
        "previous_rentals_count": 3,
        "average_stay_months": 18.0,
    },
    {
        "full_name": "Hamza Berrada",
        "age": 25,
        "monthly_income": 6_200,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 4,
        "target_rent": 3_600,
        "total_payments": 8,
        "on_time_payments": 8,
        "late_payments": 0,
        "previous_rentals_count": 1,
        "average_stay_months": 11.0,
    },
    {
        "full_name": "Amal Serhani",
        "age": 36,
        "monthly_income": 10_200,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 84,
        "target_rent": 4_400,
        "total_payments": 44,
        "on_time_payments": 43,
        "late_payments": 1,
        "previous_rentals_count": 2,
        "average_stay_months": 40.0,
    },
    {
        "full_name": "Adam Kettani",
        "age": 22,
        "monthly_income": 2_800,
        "employment_type": EmploymentType.STUDENT,
        "employment_duration_months": 10,
        "target_rent": 2_400,
        "total_payments": 4,
        "on_time_payments": 3,
        "late_payments": 1,
        "previous_rentals_count": 0,
        "average_stay_months": 4.0,
    },
    {
        "full_name": "Soukaina Derouiche",
        "age": 33,
        "monthly_income": 8_900,
        "employment_type": EmploymentType.CDI,
        "employment_duration_months": 52,
        "target_rent": 4_100,
        "total_payments": 28,
        "on_time_payments": 27,
        "late_payments": 1,
        "previous_rentals_count": 3,
        "average_stay_months": 20.0,
    },
]


def seed_tenants(db: Session) -> int:
    db.execute(delete(Tenant))
    db.commit()
    for row in _FAKE_TENANTS:
        db.add(Tenant(**row))
    db.commit()
    return len(_FAKE_TENANTS)


def main() -> None:
    if engine is None or SessionLocal is None:
        print("DATABASE_URL is missing. Copy .env.example to .env.", file=sys.stderr)
        sys.exit(1)
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            n = seed_tenants(session)
    except OperationalError as e:
        err = str(e.orig) if getattr(e, "orig", None) else str(e)
        print("Could not connect to PostgreSQL.", file=sys.stderr)
        if "getaddrinfo failed" in err or "could not translate host name" in err.lower():
            print(
                "\n  DNS lookup failed (your PC cannot resolve the database hostname).\n"
                "\n"
                "  ► Workaround that often fixes this: use the POOLER host, not db.*.supabase.co\n"
                "    1. Supabase → Project Settings → Database → Connection string\n"
                "    2. Choose “Session pooler” (or “Transaction”); copy the URI\n"
                "    3. Replace the start with: postgresql+psycopg://\n"
                "       (host looks like aws-0-….pooler.supabase.com, port often 6543)\n"
                "    4. User is often postgres.<project-ref> — copy exactly from Supabase\n"
                "    5. Paste the full line as DATABASE_URL in backend/.env\n"
                "\n"
                "  Other fixes:\n"
                "  • Phone hotspot / different Wi‑Fi (campus DNS sometimes blocks *.supabase.co)\n"
                "  • ipconfig /flushdns  then retry\n"
                "  • Set DNS to 8.8.8.8 / 1.1.1.1 on your adapter\n"
                "  • Disable VPN temporarily\n",
                file=sys.stderr,
            )
        else:
            print(f"\n  Detail: {err}\n", file=sys.stderr)
        sys.exit(1)
    print(f"Seeded {n} tenants into PostgreSQL.")


if __name__ == "__main__":
    main()
