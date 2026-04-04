"""
Deterministic “Gemini-style” explanations for demo / offline use.

Copy is written for the Casablanca Aïn Sebaâ rental context (industrial–residential mix,
tram access, mixed salaried and informal work). No API calls; structure matches Gemini output.
"""

from __future__ import annotations

from typing import TypedDict

from app.schemas.explanations import GeminiExplanationItem, TenantScoresIn


class _Preset(TypedDict):
    summary: str
    strengths: list[str]
    concerns: list[str]

_AREA = (
    "Among applicants interested in units around Aïn Sebaâ, this profile stands out for how it "
    "balances income stability, rent discipline, and how long they typically stay once they move in."
)

# Curated landlord-facing notes keyed by seeded full_name (16 demo applicants; Aïn Sebaâ pool).
_PROFILES: dict[str, _Preset] = {
    "Youssef Amrani": {
        "summary": (
            f"{_AREA} Youssef shows a stable salaried background with a solid track record on housing "
            "payments and more than one previous lease, which usually means fewer surprises at handover. "
            "He reads as a reliable choice if you want someone who treats the lease as a long-term commitment."
        ),
        "strengths": [
            "Stable formal employment with several years in role",
            "Strong history of paying on time with limited late episodes",
            "Has completed multiple rentals without very short stays",
        ],
        "concerns": [
            "Worth confirming current employer and contract type on paper before signing",
        ],
    },
    "Salma Bennani": {
        "summary": (
            f"{_AREA} Salma presents as one of the cleaner profiles in this pool: steady income well "
            "above typical Aïn Sebaâ asking rents and a spotless payment history where records exist. "
            "For a landlord prioritizing predictability, she is easy to recommend on paper."
        ),
        "strengths": [
            "Comfortable margin between income and targeted rent",
            "Perfect on-time payment record in the history we see",
            "Established CDI-style career path",
        ],
        "concerns": [],
    },
    "Mehdi Chraibi": {
        "summary": (
            f"{_AREA} Mehdi is a seasoned freelancer with several past addresses—useful experience, "
            "but freelancing in this corridor can mean income swings. His file shows some late payments "
            "mixed with long-term rentals, so a conversation about cash-flow and guarantor backup is prudent."
        ),
        "strengths": [
            "Long self-employed track record",
            "Has rented multiple times in Casablanca",
            "Generally completes leases rather than leaving early",
        ],
        "concerns": [
            "Several late payments in the history—ask what happened and whether it’s resolved",
            "Income may vary month to month; consider guarantor or higher deposit if policy allows",
        ],
    },
    "Hanae El Fassi": {
        "summary": (
            f"{_AREA} Hanae is a young student applicant; the main question is affordability relative to "
            "the rent she is targeting near Aïn Sebaâ. With parental or family support documented, she can "
            "still be workable; without it, the profile is thinner than typical landlord comfort levels."
        ),
        "strengths": [
            "Straightforward student situation—easy to verify enrollment",
            "Some rental history already started",
        ],
        "concerns": [
            "Income alone may not carry the lease without a solid guarantor",
            "Limited tenure in previous stay",
            "Ask for proof of support or bursary if rent is aggressive",
        ],
    },
    "Omar Tazi": {
        "summary": (
            f"{_AREA} Omar is a mature professional with a long career arc and income that comfortably "
            "covers the rent band he is asking for. Payment behavior and prior leases look consistent with "
            "someone who treats housing as stable overhead rather than a stretch."
        ),
        "strengths": [
            "Strong earning power relative to target rent",
            "Very high share of on-time payments",
            "Meaningful rental history with reasonable average stay",
        ],
        "concerns": [
            "Standard diligence: confirm references from the most recent landlord",
        ],
    },
    "Kenza Idrissi": {
        "summary": (
            f"{_AREA} Kenza combines formal employment with a payment history that is almost entirely "
            "on time and multiple completed leases. She fits the profile many owners in Aïn Sebaâ want: "
            "employed, predictable, and already house-trained from prior tenancies."
        ),
        "strengths": [
            "Stable job with a couple of years in post",
            "Excellent payment discipline",
            "Repeat renter with moderate-length stays",
        ],
        "concerns": [],
    },
    "Karim Benjelloun": {
        "summary": (
            f"{_AREA} Karim’s file is mixed: he has freelancing experience and has rented often, but "
            "the payment ledger shows repeated lateness. In Aïn Sebaâ’s market that doesn’t automatically "
            "disqualify, but you should treat this as a higher-risk candidate unless mitigations are clear."
        ),
        "strengths": [
            "Knows the rental process; multiple prior addresses",
            "Still generating income from independent work",
        ],
        "concerns": [
            "Pattern of late payments—discuss causes and evidence of improvement",
            "Shorter average stays; ask why moves happened",
            "Consider stricter deposit, bank guarantee, or guarantor if you proceed",
        ],
    },
    "Imane Alaoui": {
        "summary": (
            f"{_AREA} Imane reads as a strong mid-market applicant: long tenure in her field, income that "
            "supports the rent, and payment behavior that landlords generally trust. She’s the type of "
            "profile that often rises to the shortlist when comparing several names side by side."
        ),
        "strengths": [
            "Established career with multi-year continuity",
            "Very good on-time payment ratio",
            "Reasonable prior rental stability",
        ],
        "concerns": [
            "Minor: confirm employer contact is current",
        ],
    },
    "Amine Filali": {
        "summary": (
            f"{_AREA} Amine is early-career / student-adjacent with modest income and a short rental trail. "
            "He may still be viable for smaller units or shared arrangements, but for a standard lease in "
            "Aïn Sebaâ you will want family backing or a guarantor spelled out in the file."
        ),
        "strengths": [
            "Early payment history mostly positive",
            "Young profile can mean longer horizon if studies finish locally",
        ],
        "concerns": [
            "Limited history and no prior long lease",
            "Income may need supplementation for the rent requested",
        ],
    },
    "Nadia Mansouri": {
        "summary": (
            f"{_AREA} Nadia is a standout on financial reliability: income is ample for the rent, and her "
            "record shows consistent on-time behavior across a multi-year window. For owners comparing "
            "several candidates, she typically lands in the top tier on trust alone."
        ),
        "strengths": [
            "High income cushion versus target rent",
            "Perfect on-time payment streak in available history",
            "Stable professional with long employment continuity",
        ],
        "concerns": [],
    },
    "Reda Ouazzani": {
        "summary": (
            f"{_AREA} Reda’s situation is difficult on paper: current employment gap, rent ambition that "
            "doesn’t match visible income, and a payment history with many late items. Unless there is a "
            "credible guarantor, savings proof, or a much lower rent, most landlords would pass or ask for "
            "strong extra security."
        ),
        "strengths": [
            "Has rented before—references may still clarify context",
        ],
        "concerns": [
            "Employment not currently supporting the lease",
            "Frequent late payments in history",
            "High move count with shorter stays—ask for clear plan before committing",
        ],
    },
    "Yasmine Lahsen": {
        "summary": (
            f"{_AREA} Yasmine is an experienced freelancer with income that usually clears typical Aïn Sebaâ "
            "rents and a payment history that is largely on time. She’s a sensible match if you accept "
            "non-salaried tenants but want fewer red flags than average."
        ),
        "strengths": [
            "Solid freelance tenure",
            "Good on-time ratio with only occasional slips",
            "Multiple prior rentals with moderate stay length",
        ],
        "concerns": [
            "Request recent bank statements or tax summaries if your policy requires them",
        ],
    },
    "Hamza Berrada": {
        "summary": (
            f"{_AREA} Hamza is newer in his current job but shows perfect payment behavior in the short "
            "window we see and a conservative rent ask relative to income. Many landlords view him as "
            "promising if the probation period is handled with a standard reference check."
        ),
        "strengths": [
            "Formal employment with upward mobility potential",
            "No late payments in recorded history",
            "Rent level looks affordable versus stated income",
        ],
        "concerns": [
            "Shorter job tenure—confirm end of trial period if applicable",
        ],
    },
    "Amal Serhani": {
        "summary": (
            f"{_AREA} Amal combines long job continuity with income that supports the rent band and a "
            "payment history that is nearly flawless. For a family-sized or mid-range unit near transport "
            "hubs, she is among the profiles that feel ‘low drama’ to reference-check."
        ),
        "strengths": [
            "Many years in stable employment",
            "Excellent payment track record",
            "Long average stays—suggests stable household rhythm",
        ],
        "concerns": [],
    },
    "Adam Kettani": {
        "summary": (
            f"{_AREA} Adam is a student with a tight budget and very little rental history. He can work "
            "for student-oriented stock or with parental guarantee, but for an unfurnished family lease in "
            "Aïn Sebaâ you should treat the file as incomplete without extra documentation."
        ),
        "strengths": [
            "Student status is easy to verify",
            "Modest rent ask if matched to small units",
        ],
        "concerns": [
            "Very thin payment and rental history",
            "May need guarantor and proof of funding for the full year",
        ],
    },
    "Soukaina Derouiche": {
        "summary": (
            f"{_AREA} Soukaina offers a balanced salaried profile with several years in role, income aligned "
            "with mid-market rents, and a strong majority of on-time payments. She reads as a dependable "
            "candidate when you are comparing several serious applicants from the same neighborhood pool."
        ),
        "strengths": [
            "Stable CDI-style employment history",
            "Income reasonably matched to target rent",
            "Good rental payment pattern with minimal late items",
        ],
        "concerns": [
            "Routine landlord reference from last property still recommended",
        ],
    },
}


def _band(combined: float) -> str:
    if combined >= 82:
        return "strong"
    if combined >= 68:
        return "solid"
    if combined >= 52:
        return "mixed"
    return "weak"


def _generic_item(t: TenantScoresIn) -> GeminiExplanationItem:
    b = _band(t.combined_score)
    if b == "strong":
        summary = (
            f"{_AREA} {t.name.split()[0]} shows a profile that landlords in the Aïn Sebaâ corridor often "
            "shortlist: overall reliability looks high, with few warning signs in how income, payment "
            "habits, and stability line up together."
        )
        strengths = [
            "Overall evaluation reads favorably across financial and rental-behavior signals",
            "Good fit for owners who want a straightforward reference conversation",
        ]
        concerns: list[str] = ["Confirm identity documents and latest payslip or income proof as usual."]
    elif b == "solid":
        summary = (
            f"{_AREA} {t.name.split()[0]} is a workable mainstream applicant: nothing in the composite "
            "picture screams high risk, but you should still run the usual landlord checks and ask about "
            "any gaps in employment or housing."
        )
        strengths = [
            "Balanced picture between earning power and housing track record",
            "Reasonable candidate for standard lease terms",
        ]
        concerns = [
            "Ask for recent landlord reference to corroborate payment habits",
        ]
    elif b == "mixed":
        summary = (
            f"{_AREA} {t.name.split()[0]} is a mixed file—there are positives, but also areas where a "
            "prudent owner will want direct answers (cash flow, past late rent, or job type) before "
            "committing, especially in a competitive Aïn Sebaâ listing."
        )
        strengths = [
            "Some indicators still support proceeding with extra documentation",
        ]
        concerns = [
            "Review payment timing and employment type carefully",
            "Consider guarantor or additional security if internal policy allows",
        ]
    else:
        summary = (
            f"{_AREA} {t.name.split()[0]} is a higher-caution profile relative to other names you might "
            "compare. That does not always mean ‘no,’ but you should only advance with clear mitigations "
            "and written proof of income or backing."
        )
        strengths = [
            "May still be viable with strong guarantor or adjusted rent / unit type",
        ]
        concerns = [
            "Several signals suggest elevated default or friction risk",
            "Recommend senior review before accepting without extra guarantees",
        ]

    return GeminiExplanationItem(
        name=t.name,
        summary=summary,
        strengths=strengths,
        concerns=concerns,
    )


def generate_fake_explanations(tenants: list[TenantScoresIn]) -> list[GeminiExplanationItem]:
    """
    Returns one explanation per input row, same order, same `name` strings (for merge_with_input).
    """
    out: list[GeminiExplanationItem] = []
    for t in tenants:
        preset = _PROFILES.get(t.name.strip())
        if preset:
            out.append(
                GeminiExplanationItem(
                    name=t.name,
                    summary=preset["summary"],
                    strengths=preset["strengths"],
                    concerns=preset["concerns"],
                )
            )
        else:
            out.append(_generic_item(t))
    return out
