"""Build the retrieval corpus from CareKaki's public data files.

Three sources, one normalized passage schema:
  - AIC eldercare services (EldercareServices.geojson)
  - CHAS clinics            (CHASClinics.geojson)
  - HSA product register    (ListingofRegisteredTherapeuticProducts.csv)
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from html import unescape
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@dataclass
class Passage:
    id: str
    source: str          # "AIC Eldercare" | "CHAS Clinics" | "HSA Register"
    title: str
    text: str            # the field the retriever indexes/embeds

    def to_dict(self) -> dict:
        return asdict(self)


def _html_field(description_html: str, field_name: str) -> str:
    pattern = rf"<th>{re.escape(field_name)}</th>\s*<td>(.*?)</td>"
    m = re.search(pattern, description_html, re.IGNORECASE | re.DOTALL)
    if not m:
        return ""
    return unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip())


def _load_eldercare() -> list[Passage]:
    path = DATA_DIR / "EldercareServices.geojson"
    geo = json.loads(path.read_text(encoding="utf-8"))
    out: list[Passage] = []
    for i, feat in enumerate(geo.get("features", [])):
        html = feat.get("properties", {}).get("Description", "")
        name = _html_field(html, "NAME")
        if not name:
            continue
        desc = _html_field(html, "DESCRIPTION")
        addr = _html_field(html, "ADDRESSSTREETNAME")
        postal = _html_field(html, "ADDRESSPOSTALCODE")
        text = f"{name}. {desc} Located at {addr} (S{postal}). Senior eldercare service."
        out.append(Passage(f"ELD-{i}", "AIC Eldercare", name, " ".join(text.split())))
    return out


def _load_chas() -> list[Passage]:
    path = DATA_DIR / "CHASClinics.geojson"
    geo = json.loads(path.read_text(encoding="utf-8"))
    out: list[Passage] = []
    for i, feat in enumerate(geo.get("features", [])):
        html = feat.get("properties", {}).get("Description", "")
        name = _html_field(html, "HCI_NAME")
        if not name:
            continue
        block = _html_field(html, "ADDR_TYPE") or ""
        street = _html_field(html, "BLK_HSE_NO") + " " + _html_field(html, "STREET_NAME")
        postal = _html_field(html, "POSTAL_CD")
        tel = _html_field(html, "HCI_TEL")
        clinic_type = _html_field(html, "CLINIC_PROGRAMME_CODE") or _html_field(html, "LICENCE_TYPE")
        text = (f"{name}. CHAS subsidised clinic ({clinic_type}). "
                f"{street} (S{postal}). Tel {tel}. Subsidised outpatient GP care.")
        out.append(Passage(f"CHAS-{i}", "CHAS Clinics", name, " ".join(text.split())))
    return out


def _load_hsa(limit: int = 1500) -> list[Passage]:
    import pandas as pd
    path = DATA_DIR / "ListingofRegisteredTherapeuticProducts.csv"
    df = pd.read_csv(path, dtype=str).fillna("")
    df.columns = df.columns.str.strip()
    out: list[Passage] = []
    for i, row in df.head(limit).iterrows():
        name = row.get("product_name", "").strip()
        if not name:
            continue
        text = (f"{name}. Active ingredient: {row.get('active_ingredients','')}. "
                f"Classification: {row.get('forensic_classification','')}. "
                f"Form: {row.get('dosage_form','')} {row.get('strength','')}. "
                f"ATC {row.get('atc_code','')}. HSA-registered medication.")
        out.append(Passage(f"HSA-{i}", "HSA Register", name, " ".join(text.split())))
    return out


def build_corpus(include_hsa: bool = True, hsa_limit: int = 1500) -> list[Passage]:
    corpus = _load_eldercare() + _load_chas()
    if include_hsa:
        corpus += _load_hsa(limit=hsa_limit)
    return corpus
