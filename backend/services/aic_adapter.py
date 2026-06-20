"""
AIC-style Care Service Recommendation Adapter

Prototype adapter using public eldercare services data.
Where official AIC APIs are unavailable, CareKaki uses an API-compatible
adapter built on public Singapore eldercare service data. In production,
the same adapter interface can be connected to official AIC or partner systems.
"""

import json
import math
import re
from html import unescape
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "EldercareServices.geojson"

# ── 1. HTML field extraction ─────────────────────────────────────────────────

def extract_html_field(description_html: str, field_name: str) -> str:
    pattern = rf"<th>{re.escape(field_name)}</th>\s*<td>(.*?)</td>"
    match = re.search(pattern, description_html, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    raw = match.group(1)
    cleaned = re.sub(r"<[^>]+>", "", raw).strip()
    return unescape(cleaned)


# ── 2. Load and normalize GeoJSON ────────────────────────────────────────────

_cache: list[dict] | None = None

def load_eldercare_services() -> list[dict]:
    global _cache
    if _cache is not None:
        return _cache

    with open(DATA_PATH, encoding="utf-8") as f:
        geo = json.load(f)

    services = []
    for feature in geo.get("features", []):
        props = feature.get("properties", {})
        desc_html = props.get("Description", "")
        coords = feature.get("geometry", {}).get("coordinates", [0, 0])

        name = extract_html_field(desc_html, "NAME")
        if not name:
            continue

        services.append({
            "name": name,
            "postal_code": extract_html_field(desc_html, "ADDRESSPOSTALCODE"),
            "address": extract_html_field(desc_html, "ADDRESSSTREETNAME"),
            "description": extract_html_field(desc_html, "DESCRIPTION"),
            "latitude": coords[1],
            "longitude": coords[0],
            "raw_kml_name": props.get("Name", ""),
        })

    _cache = services
    return services


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


# ── 4. Classify care need into keywords ──────────────────────────────────────

NEED_RULES: list[tuple[list[str], list[str]]] = [
    (
        ["fall", "fell", "stair", "weak", "mobility", "walking", "slip", "fracture"],
        ["senior activity centre", "senior care", "active ageing", "SAC", "befriending"],
    ),
    (
        ["lonely", "alone", "isolated", "social", "depressed"],
        ["senior activity centre", "befriending", "active ageing", "community"],
    ),
    (
        ["dementia", "confused", "wandering", "memory", "alzheimer"],
        ["senior care", "care corner", "community", "dementia"],
    ),
    (
        ["caregiver", "burnout", "respite", "tired", "stress"],
        ["senior care", "caregiver support", "community", "respite"],
    ),
]

DEFAULT_KEYWORDS = ["senior activity centre", "active ageing", "community", "SAC"]


def classify_need(care_need: str) -> list[str]:
    lower = care_need.lower()
    keywords: list[str] = []
    for triggers, kws in NEED_RULES:
        if any(t in lower for t in triggers):
            keywords.extend(kws)
    if not keywords:
        keywords = list(DEFAULT_KEYWORDS)
    return list(dict.fromkeys(keywords))


# ── 5. Score a service against keywords ──────────────────────────────────────

def score_service(service: dict, keywords: list[str]) -> int:
    haystack = f"{service['name']} {service['description']} {service['address']}".lower()
    score = 0
    for kw in keywords:
        if kw.lower() in haystack:
            score += 10
    if "senior" in haystack or "sac" in haystack:
        score += 3
    return score


# ── 6. Recommend services ────────────────────────────────────────────────────

def recommend_aic_services(
    care_need: str,
    user_latitude: float | None = None,
    user_longitude: float | None = None,
    limit: int = 3,
) -> dict:
    services = load_eldercare_services()
    keywords = classify_need(care_need)

    scored = []
    for svc in services:
        match_score = score_service(svc, keywords)

        distance_km = None
        distance_score = 0.0
        if user_latitude is not None and user_longitude is not None:
            distance_km = round(
                haversine_km(user_latitude, user_longitude, svc["latitude"], svc["longitude"]),
                2,
            )
            distance_score = max(0, 30 - distance_km * 3)

        total_score = match_score + distance_score

        scored.append({
            "name": svc["name"],
            "address": svc["address"],
            "postal_code": svc["postal_code"],
            "latitude": svc["latitude"],
            "longitude": svc["longitude"],
            "distance_km": distance_km,
            "match_score": match_score,
            "total_score": round(total_score, 1),
            "reason": "Matched using AIC-style care need rules and nearby eldercare service data.",
            "next_step": "Contact the centre or call AIC for official referral guidance.",
        })

    scored.sort(key=lambda x: x["total_score"], reverse=True)

    return {
        "adapter": "AIC-style Care Service Recommendation Adapter",
        "care_need": care_need,
        "keywords_used": keywords,
        "dataset_type": "Public eldercare services GeoJSON",
        "disclaimer": "Prototype only. This is not a real AIC API integration.",
        "recommended_services": scored[:limit],
    }
