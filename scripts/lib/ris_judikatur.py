"""
ris_judikatur.py — Amtliche Rechtsprechung (OGH, VfGH, VwGH) aus der RIS-Justiz API.

Ersetzt unzuverlässiges Web-Scraping privater Plattformen (JUSLINE)
durch die offizielle Open Government Data REST API des Bundeskanzleramts (BKA).
Zero pip dependencies (nur Python 3 stdlib).
"""

import json
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from .receipt import CourtDecision, parse_date_to_iso

RIS_JUSTIZ_API = "https://data.bka.gv.at/ris/api/v2.6/Justiz"
USER_AGENT = "austrian-law-kit/1.0 (+https://github.com/martinderm/austrian-law-kit)"
DEFAULT_TIMEOUT = 15


def search_case_law(
    query: Optional[str] = None,
    norm: Optional[str] = None,
    paragraph: Optional[str] = None,
    court: Optional[str] = "OGH",
    limit: int = 5,
    timeout: int = DEFAULT_TIMEOUT,
) -> List[CourtDecision]:
    """
    Fragt amtliche österreichische Gerichtsentscheidungen (insb. OGH) über die RIS OGD API ab.
    Unterstützt Suche nach Norm (z. B. "MRG"), Paragraf (z. B. "§ 29") und Freitext-Suchworten.
    """
    params: Dict[str, str] = {
        "Applikation": "Justiz",
        "ImRisSeit": "Undefined",
    }

    if court:
        params["Gericht"] = court

    # Norm-Kombination
    norm_filter = []
    if norm:
        norm_filter.append(norm.strip())
    if paragraph:
        norm_filter.append(paragraph.strip())
    if norm_filter:
        params["Norm"] = " ".join(norm_filter)

    if query:
        params["Suchworte"] = query.strip()

    full_url = f"{RIS_JUSTIZ_API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        full_url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return []

    decisions: List[CourtDecision] = []

    try:
        doc_results = data.get("OgdSearchResult", {}).get("OgdDocumentResults", {})
        doc_refs = doc_results.get("OgdDocumentReference", [])
        if isinstance(doc_refs, dict):
            doc_refs = [doc_refs]

        for ref in doc_refs[:limit]:
            d_data = ref.get("Data", {})
            meta = d_data.get("Metadaten", {})
            justiz = meta.get("Justiz", {})

            gz = justiz.get("Geschaeftszahl", "")
            rs_nr = justiz.get("Rechtssatznummer", "")
            decision_court = justiz.get("Gericht", court or "OGH")
            raw_date = justiz.get("Entscheidungsdatum", "")
            iso_date = parse_date_to_iso(raw_date)

            # Spruch / Rechtssatztext
            spruch_parts = []
            spruch_elem = justiz.get("Spruch", "")
            if isinstance(spruch_elem, str):
                spruch_parts.append(spruch_elem)
            elif isinstance(spruch_elem, list):
                spruch_parts.extend([str(s) for s in spruch_elem])

            rs_elem = justiz.get("Rechtssatz", "")
            if isinstance(rs_elem, str):
                spruch_parts.append(rs_elem)

            leitsatz = "\n".join(spruch_parts).strip()
            if not leitsatz:
                leitsatz = justiz.get("Kurztitel", "Leitsatz nicht gesondert ausgewiesen.")

            ecli = justiz.get("Ecli")
            fundstellen = justiz.get("Fundstelle", [])
            if isinstance(fundstellen, str):
                fundstellen = [fundstellen]

            decisions.append(
                CourtDecision(
                    case_number=gz or rs_nr or "Unbekannt",
                    court=decision_court,
                    leitsatz=leitsatz,
                    decision_date=iso_date,
                    rechtssatznummer=rs_nr if rs_nr else None,
                    ecli=ecli,
                    fundstellen=fundstellen or [],
                )
            )
    except Exception:
        pass

    return decisions
