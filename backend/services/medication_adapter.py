"""
Medication Review Support Adapter

Prototype adapter that identifies medication-related concerns, looks up
Singapore-registered therapeutic product information (HSA dataset), optionally
enriches with public openFDA drug label data, and generates safe review flags.

THIS IS NOT A MEDICAL DIAGNOSIS SYSTEM. It does not prescribe, stop, or change
medication. It only flags concerns for pharmacist review.
"""

import os
import re
import requests as http_requests
import pandas as pd
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "ListingofRegisteredTherapeuticProducts.csv"

OPENFDA_API_KEY = os.getenv("OPENFDA_API_TOKEN", "")

COMMON_MEDICATIONS = [
    "amlodipine", "metformin", "losartan", "atorvastatin", "simvastatin",
    "aspirin", "clopidogrel", "warfarin", "insulin", "paracetamol",
    "ibuprofen", "diclofenac", "furosemide", "bisoprolol", "atenolol",
    "omeprazole", "pantoprazole", "gabapentin", "pregabalin", "lisinopril",
    "hydrochlorothiazide", "glipizide", "gliclazide", "donepezil",
    "memantine", "levothyroxine", "prednisolone", "dexamethasone",
]

MEDIUM_SYMPTOMS = ["dizzy", "dizziness", "faint", "weak", "confused", "fall", "fell", "giddy", "blur", "nausea"]
HIGH_SYMPTOMS = ["chest pain", "shortness of breath", "unconscious", "seizure", "bleeding", "collapse", "unresponsive"]


# ── 1. Load HSA products ────────────────────────────────────────────────────

_hsa_cache: pd.DataFrame | None = None


def load_hsa_products() -> pd.DataFrame:
    global _hsa_cache
    if _hsa_cache is not None:
        return _hsa_cache

    df = pd.read_csv(DATA_PATH, dtype=str).fillna("")
    df.columns = df.columns.str.strip()
    df["product_name_lower"] = df["product_name"].str.lower()
    df["active_ingredients_lower"] = df["active_ingredients"].str.lower()
    _hsa_cache = df
    return df


# ── 2. Extract medication names from text ────────────────────────────────────

def extract_medications_from_text(text: str) -> list[str]:
    lower = text.lower()
    found = [med for med in COMMON_MEDICATIONS if med in lower]
    return list(dict.fromkeys(found))


# ── 3. Search HSA products ──────────────────────────────────────────────────

def search_hsa_products(medication_name: str, limit: int = 5) -> list[dict]:
    df = load_hsa_products()
    med_lower = medication_name.lower()

    mask = (
        df["product_name_lower"].str.contains(med_lower, na=False)
        | df["active_ingredients_lower"].str.contains(med_lower, na=False)
    )
    matches = df[mask].head(limit)

    return [
        {
            "licence_no": row["licence_no"],
            "product_name": row["product_name"],
            "forensic_classification": row["forensic_classification"],
            "atc_code": row["atc_code"],
            "dosage_form": row["dosage_form"],
            "route": row["route_of_administration"],
            "active_ingredients": row["active_ingredients"],
            "strength": row["strength"],
            "manufacturer": row["manufacturer"],
        }
        for _, row in matches.iterrows()
    ]


# ── 4. openFDA drug label lookup ────────────────────────────────────────────

def _truncate(text: str, max_len: int = 300) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "…"


def _extract_fda_fields(result: dict) -> dict:
    fields = {}
    for key in ["warnings", "warnings_and_cautions", "precautions",
                 "adverse_reactions", "boxed_warning", "indications_and_usage"]:
        val = result.get(key)
        if val and isinstance(val, list) and val[0]:
            fields[key] = _truncate(val[0])
    return fields


def get_openfda_label_info(medication_name: str) -> dict:
    base = "https://api.fda.gov/drug/label.json"
    params_base = {"limit": "1"}
    if OPENFDA_API_KEY:
        params_base["api_key"] = OPENFDA_API_KEY

    search_attempts = [
        ("generic_name", f'openfda.generic_name:"{medication_name}"'),
        ("brand_name", f'openfda.brand_name:"{medication_name}"'),
        ("fallback", medication_name),
    ]

    for matched_field, search_query in search_attempts:
        try:
            params = {**params_base, "search": search_query}
            resp = http_requests.get(base, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results:
                    extracted = _extract_fda_fields(results[0])
                    return {
                        "found": True,
                        "source": "openFDA drug label",
                        "matched_field": matched_field,
                        "warnings_summary": extracted.get("warnings", extracted.get("warnings_and_cautions", "")),
                        "adverse_reactions_summary": extracted.get("adverse_reactions", ""),
                        "precautions_summary": extracted.get("precautions", ""),
                        "boxed_warning": extracted.get("boxed_warning", ""),
                        "indications": extracted.get("indications_and_usage", ""),
                        "raw_available_fields": list(extracted.keys()),
                    }
        except Exception:
            continue

    return {
        "found": False,
        "source": "openFDA drug label",
        "matched_field": None,
        "warnings_summary": "",
        "adverse_reactions_summary": "",
        "precautions_summary": "",
        "boxed_warning": "",
        "indications": "",
        "raw_available_fields": [],
    }


# ── 5. Classify medication risk ─────────────────────────────────────────────

def classify_medication_risk(
    symptom: str,
    age: int,
    context: str,
    matched_products: dict[str, list[dict]],
    openfda_infos: dict[str, dict],
) -> dict:
    flags: list[str] = []
    risk = "low"
    combined_text = f"{symptom} {context}".lower()

    if age >= 65:
        flags.append(f"Senior is aged {age} — higher sensitivity to medication side effects.")

    for kw in HIGH_SYMPTOMS:
        if kw in combined_text:
            risk = "high"
            flags.append(f"Reported symptom '{kw}' — urgent escalation recommended.")
            break

    if risk != "high":
        for kw in MEDIUM_SYMPTOMS:
            if kw in combined_text:
                risk = "medium"
                flags.append(f"Reported symptom '{kw}' may increase fall risk in elderly patients.")
                break

    for med, products in matched_products.items():
        if not products:
            flags.append(f"No HSA-registered product found for '{med}' — verify medication name.")
        else:
            for p in products[:1]:
                fc = p.get("forensic_classification", "")
                if "prescription only" in fc.lower():
                    flags.append(f"'{med}' is classified as '{fc}' in Singapore — pharmacist review recommended.")

    for med, info in openfda_infos.items():
        if info.get("found"):
            if info.get("warnings_summary") or info.get("precautions_summary"):
                flags.append(f"Public label warning/precaution information found for '{med}' — pharmacist review recommended.")
            if info.get("boxed_warning"):
                flags.append(f"Boxed warning exists for '{med}' — pharmacist review strongly recommended.")

    flags.append("Confirm medication name, dosage, timing, and recent medication changes.")
    flags.append("This prototype does not provide diagnosis or prescription advice.")
    flags.append("For official advice, contact a pharmacist, doctor, or emergency services if symptoms are severe.")

    return {"risk_level": risk, "review_flags": flags}


# ── 6. Build medication review packet ───────────────────────────────────────

def build_medication_review_packet(
    senior_name: str,
    age: int,
    medications: list[str] | None = None,
    symptom: str = "",
    context: str = "",
    raw_message: str = "",
) -> dict:
    if not medications:
        combined = f"{symptom} {context} {raw_message}"
        medications = extract_medications_from_text(combined)

    hsa_matches: dict[str, list[dict]] = {}
    openfda_info: dict[str, dict] = {}

    for med in medications:
        hsa_matches[med] = search_hsa_products(med, limit=3)
        openfda_info[med] = get_openfda_label_info(med)

    risk = classify_medication_risk(symptom, age, context, hsa_matches, openfda_info)

    return {
        "adapter": "Medication Review Support Adapter",
        "status": "ready_for_pharmacy_review",
        "senior_name": senior_name,
        "age": age,
        "medications": medications,
        "symptom": symptom,
        "context": context,
        "hsa_matches": hsa_matches,
        "openfda_info": openfda_info,
        "risk_level": risk["risk_level"],
        "review_flags": risk["review_flags"],
        "disclaimer": "Prototype only. This is not medical advice and does not replace pharmacist or doctor review.",
    }


# ── 7. Format for Telegram ──────────────────────────────────────────────────

def format_packet_for_telegram(packet: dict) -> str:
    lines = [
        "<b>💊 Medication Review Request</b>",
        "",
        f"<b>Senior:</b> {packet['senior_name']}, {packet['age']}",
        f"<b>Concern:</b> {packet['symptom']}",
        f"<b>Context:</b> {packet['context']}",
        f"<b>Medications:</b> {', '.join(packet['medications'])}",
        f"<b>Risk level:</b> {packet['risk_level'].upper()}",
        "",
        "<b>HSA dataset matches:</b>",
    ]

    for med, products in packet["hsa_matches"].items():
        if products:
            p = products[0]
            lines.append(f"• {med}: {p['product_name']} ({p['forensic_classification']}, {p['active_ingredients']}, {p['strength']})")
        else:
            lines.append(f"• {med}: No HSA match found")

    lines.append("")
    lines.append("<b>openFDA public label context:</b>")

    for med, info in packet["openfda_info"].items():
        if info.get("found"):
            parts = []
            if info.get("warnings_summary"):
                parts.append("warnings found")
            if info.get("precautions_summary"):
                parts.append("precautions found")
            if info.get("adverse_reactions_summary"):
                parts.append("adverse reactions found")
            if info.get("boxed_warning"):
                parts.append("BOXED WARNING")
            lines.append(f"• {med}: {', '.join(parts) if parts else 'label found'} — pharmacist review recommended")
        else:
            lines.append(f"• {med}: No openFDA label found")

    lines.append("")
    lines.append("<b>System review flags:</b>")
    for flag in packet["review_flags"]:
        lines.append(f"• {flag}")

    lines.append("")
    lines.append("Please review and advise next step.")

    return "\n".join(lines)
