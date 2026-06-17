"""
HomeNursing.sg-style Provider Booking Adapter

Prototype adapter using public CHAS Clinics GeoJSON data + simulated
availability slots. Where official HomeNursing.sg booking APIs are
unavailable, CareKaki uses an API-compatible adapter built on public
Singapore healthcare data. In production, the same adapter interface
can be connected to official HomeNursing.sg or partner systems.
"""

import json
import math
import random
import re
from datetime import datetime, timedelta
from html import unescape
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "CHASClinics.geojson"


# ── 1. HTML field extraction (reused pattern from aic_adapter) ───────────────

def extract_html_field(description_html: str, field_name: str) -> str:
    pattern = rf"<th>{re.escape(field_name)}</th>\s*<td>(.*?)</td>"
    match = re.search(pattern, description_html, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    cleaned = re.sub(r"<[^>]+>", "", match.group(1)).strip()
    return unescape(cleaned)


# ── 2. Load and normalize CHAS clinics GeoJSON ──────────────────────────────

_cache: list[dict] | None = None


def load_providers() -> list[dict]:
    global _cache
    if _cache is not None:
        return _cache

    with open(DATA_PATH, encoding="utf-8") as f:
        geo = json.load(f)

    providers = []
    for feature in geo.get("features", []):
        props = feature.get("properties", {})
        desc_html = props.get("Description", "")
        coords = feature.get("geometry", {}).get("coordinates", [0, 0])

        name = extract_html_field(desc_html, "HCI_NAME")
        if not name:
            continue

        blk = extract_html_field(desc_html, "BLK_HSE_NO")
        floor = extract_html_field(desc_html, "FLOOR_NO")
        unit = extract_html_field(desc_html, "UNIT_NO")
        street = extract_html_field(desc_html, "STREET_NAME")
        building = extract_html_field(desc_html, "BUILDING_NAME")

        parts = []
        if blk:
            parts.append(f"Blk {blk}")
        if street:
            parts.append(street)
        if floor and unit:
            parts.append(f"#{floor}-{unit}")
        if building:
            parts.append(building)
        address = ", ".join(parts) if parts else ""

        programmes = extract_html_field(desc_html, "CLINIC_PROGRAMME_CODE")

        providers.append({
            "name": name,
            "postal_code": extract_html_field(desc_html, "POSTAL_CD"),
            "address": address,
            "phone": extract_html_field(desc_html, "HCI_TEL"),
            "programmes": [p.strip() for p in programmes.split(",") if p.strip()],
            "licence_type": extract_html_field(desc_html, "LICENCE_TYPE"),
            "latitude": coords[1],
            "longitude": coords[0],
            "raw_kml_name": props.get("Name", ""),
        })

    _cache = providers
    return providers


# ── 3. Haversine distance ────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── 4. Classify care need into service keywords ─────────────────────────────

NEED_RULES: list[tuple[list[str], list[str]]] = [
    (
        ["fall", "fell", "stair", "weak", "mobility", "fracture", "injury", "pain"],
        ["clinic", "family", "medical", "surgery", "ortho"],
    ),
    (
        ["wound", "dressing", "injection", "drip", "catheter", "tube"],
        ["clinic", "medical", "nursing", "surgery"],
    ),
    (
        ["chronic", "diabetes", "hypertension", "cholesterol", "heart"],
        ["CDMP", "clinic", "family", "medical"],
    ),
    (
        ["fever", "cough", "flu", "sick", "unwell", "vomit"],
        ["clinic", "family", "medical", "surgery"],
    ),
    (
        ["elderly", "senior", "aged", "old", "granny", "grandma", "grandfather"],
        ["clinic", "family", "medical", "CHAS", "ISP"],
    ),
]

DEFAULT_KEYWORDS = ["clinic", "family", "medical", "CHAS"]


def classify_need(care_need: str) -> list[str]:
    lower = care_need.lower()
    keywords: list[str] = []
    for triggers, kws in NEED_RULES:
        if any(t in lower for t in triggers):
            keywords.extend(kws)
    if not keywords:
        keywords = list(DEFAULT_KEYWORDS)
    return list(dict.fromkeys(keywords))


# ── 5. Score a provider against keywords ─────────────────────────────────────

def score_provider(provider: dict, keywords: list[str]) -> int:
    haystack = f"{provider['name']} {' '.join(provider['programmes'])} {provider['address']}".lower()
    score = 0
    for kw in keywords:
        if kw.lower() in haystack:
            score += 10
    if "CDMP" in provider["programmes"]:
        score += 5
    if "ISP" in provider["programmes"]:
        score += 3
    return score


# ── 6. Generate simulated availability slots ─────────────────────────────────

def generate_slots(provider_name: str, num_slots: int = 3) -> list[dict]:
    random.seed(hash(provider_name) % 2**32)
    base = datetime.now() + timedelta(days=1)
    slots = []
    for i in range(num_slots):
        day = base + timedelta(days=random.randint(0, 6))
        hour = random.choice([9, 10, 11, 14, 15, 16])
        slot_time = day.replace(hour=hour, minute=0, second=0, microsecond=0)
        slots.append({
            "date": slot_time.strftime("%a %d %b"),
            "time": slot_time.strftime("%I:%M %p"),
            "type": random.choice(["Home Visit", "Clinic Visit", "Teleconsult"]),
        })
    slots.sort(key=lambda s: s["date"])
    return slots


# ── 7. Recommend providers ───────────────────────────────────────────────────

def recommend_nursing_providers(
    care_need: str,
    user_latitude: float | None = None,
    user_longitude: float | None = None,
    limit: int = 3,
) -> dict:
    providers = load_providers()
    keywords = classify_need(care_need)

    scored = []
    for prov in providers:
        match_score = score_provider(prov, keywords)

        distance_km = None
        distance_score = 0.0
        if user_latitude is not None and user_longitude is not None:
            distance_km = round(
                haversine_km(user_latitude, user_longitude, prov["latitude"], prov["longitude"]),
                2,
            )
            distance_score = max(0, 30 - distance_km * 3)

        total_score = match_score + distance_score

        scored.append({
            "name": prov["name"],
            "address": prov["address"],
            "postal_code": prov["postal_code"],
            "phone": prov["phone"],
            "programmes": prov["programmes"],
            "latitude": prov["latitude"],
            "longitude": prov["longitude"],
            "distance_km": distance_km,
            "match_score": match_score,
            "total_score": round(total_score, 1),
            "available_slots": generate_slots(prov["name"]),
            "booking_status": "tentative",
            "next_step": "Call clinic to confirm slot, or request CareKaki to auto-book.",
        })

    scored.sort(key=lambda x: x["total_score"], reverse=True)

    return {
        "adapter": "HomeNursing.sg-style Provider Booking Adapter",
        "care_need": care_need,
        "keywords_used": keywords,
        "dataset_type": "Public CHAS Clinics GeoJSON + simulated availability",
        "disclaimer": "Prototype only. This is not a real HomeNursing.sg API integration.",
        "recommended_providers": scored[:limit],
    }
