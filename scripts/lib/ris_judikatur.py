"""
ris_judikatur.py — Amtliche Rechtsprechung (OGH, VfGH, VwGH) aus der RIS-Judikatur API.

Ersetzt unzuverlässiges Web-Scraping privater Plattformen (JUSLINE)
durch die offizielle Open Government Data REST API des Bundeskanzleramts (BKA).
Endpunkt: https://data.bka.gv.at/ris/api/v2.6/Judikatur?Applikation=Justiz
Zero pip dependencies (nur Python 3 stdlib).
"""

import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional

from .receipt import CourtDecision, parse_date_to_iso

RIS_JUDIKATUR_API = "https://data.bka.gv.at/ris/api/v2.6/Judikatur"
USER_AGENT = "austrian-law-kit/1.0 (+https://github.com/martinderm/austrian-law-kit)"
DEFAULT_TIMEOUT = 15


def _fetch_xml_rechtssatz_text(xml_url: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[str]:
    """Lädt das Rechtssatz-XML und extrahiert den Leitsatztext."""
    req = urllib.request.Request(xml_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read().decode("utf-8", errors="replace")
        root = ET.fromstring(content)
        parts = []
        for el in root.iter():
            ct = el.attrib.get("ct")
            if ct in ("rechtssatz", "spruch", "text"):
                text = "".join(el.itertext()).strip()
                if text:
                    parts.append(text)
        return "\n\n".join(parts) if parts else None
    except Exception:
        return None


def search_case_law(
    query: Optional[str] = None,
    norm: Optional[str] = None,
    paragraph: Optional[str] = None,
    court: Optional[str] = "OGH",
    limit: int = 3,
    timeout: int = DEFAULT_TIMEOUT,
) -> List[CourtDecision]:
    """
    Fragt amtliche österreichische Gerichtsentscheidungen (insb. OGH) über die RIS OGD API ab.
    Unterstützt Suche nach Norm (z. B. 'MRG'), Paragraf (z. B. '§ 29') und Freitext-Suchworten.
    """
    params: Dict[str, str] = {
        "Applikation": "Justiz",
        "ImRisSeit": "Undefined",
    }

    if court:
        params["Gericht"] = court

    suchworte = []
    if norm:
        suchworte.append(norm.strip())
    if paragraph:
        suchworte.append(paragraph.strip())
    if query:
        suchworte.append(query.strip())

    if suchworte:
        params["Suchworte"] = " ".join(suchworte)

    full_url = f"{RIS_JUDIKATUR_API}?{urllib.parse.urlencode(params)}"
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
            judikatur = meta.get("Judikatur", {})
            justiz_block = judikatur.get("Justiz", {})

            # Geschäftszahl
            gz_raw = judikatur.get("Geschaeftszahl", {})
            gz = ""
            if isinstance(gz_raw, dict):
                gz = gz_raw.get("item", "")
            elif isinstance(gz_raw, str):
                gz = gz_raw
            if ";" in gz:
                gz = gz.split(";")[0].strip()

            # Rechtssatznummer
            rs_raw = justiz_block.get("Rechtssatznummern", {})
            rs_nr = None
            if isinstance(rs_raw, dict):
                rs_nr = rs_raw.get("item")
            elif isinstance(rs_raw, str):
                rs_nr = rs_raw

            decision_court = justiz_block.get("Gericht", court or "OGH")
            raw_date = judikatur.get("Entscheidungsdatum", "")
            iso_date = parse_date_to_iso(raw_date)
            ecli = judikatur.get("EuropeanCaseLawIdentifier")

            # XML-URL suchen
            xml_url = None
            urls = d_data.get("Dokumentliste", {}).get("ContentReference", {}).get("Urls", {}).get("ContentUrl", [])
            if isinstance(urls, dict):
                urls = [urls]
            for u in urls:
                if u.get("DataType", "").lower() == "xml":
                    xml_url = u.get("Url")
                    break

            leitsatz = None
            if xml_url:
                leitsatz = _fetch_xml_rechtssatz_text(xml_url, timeout=timeout)

            if not leitsatz:
                leitsatz = judikatur.get("Schlagworte") or f"Rechtssatz {rs_nr or gz}"

            decisions.append(
                CourtDecision(
                    case_number=gz or rs_nr or "Unbekannt",
                    court=decision_court,
                    leitsatz=leitsatz,
                    decision_date=iso_date,
                    rechtssatznummer=rs_nr if rs_nr else None,
                    ecli=ecli,
                    fundstellen=[],
                )
            )
    except Exception:
        pass

    return decisions
