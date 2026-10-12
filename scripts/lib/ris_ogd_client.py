"""
ris_ogd_client.py — RIS OGD Client und nativer XML-Parser für austrian-law-kit.

Parst amtliche RIS-Normen aus den XML-Endpunkten des Bundeskanzleramts (BKA)
mit der Python 3 Standardbibliothek (xml.etree.ElementTree, urllib.request).
Zero pip dependencies.
"""

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import xml.etree.ElementTree as ET

from .receipt import (
    NormSegment,
    VerificationReceipt,
    create_verification_receipt,
    get_vienna_today_iso,
    parse_date_to_iso,
)
from .storage import AtomicDiskCache

USER_AGENT = "austrian-law-kit/1.0 (+https://github.com/martinderm/austrian-law-kit)"
DEFAULT_TIMEOUT = 15

RIS_BUNDESRECHT_API = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht"
RIS_LANDESRECHT_API = "https://data.bka.gv.at/ris/api/v2.6/Landesrecht"
RIS_BUND_XML_BASE = "https://www.ris.bka.gv.at/Dokumente/Bundesnormen"
RIS_LAND_XML_BASE = "https://www.ris.bka.gv.at/Dokumente/Landesnormen"


def _clean_tag(tag: str) -> str:
    """Entfernt XML-Namespaces aus einem Tag-Namen (z. B. {http://...}absatz -> absatz)."""
    return tag.split("}")[-1] if "}" in tag else tag


def resolve_canonical_law(query: str, canonical_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """
    Sucht ein österreichisches Bundesgesetz im vorindizierten kanonischen Katalog.
    Gleicht Slug, Abkürzung, Titel und Aliase normalisiert ab.
    """
    if not query:
        return None

    if not canonical_path or not canonical_path.is_file():
        # Fallback auf Standardpfad relativ zu diesem Modul
        canonical_path = Path(__file__).resolve().parent.parent.parent / "references" / "canonical-laws.json"

    if not canonical_path.is_file():
        return None

    try:
        laws: List[Dict[str, Any]] = json.loads(canonical_path.read_text(encoding="utf-8"))
    except Exception:
        return None

    norm_query = re.sub(r"[^a-z0-9]", "", query.lower().strip())
    if not norm_query:
        return None

    for law in laws:
        # 1. Exakter Slug-Match
        if law.get("slug", "").lower() == norm_query:
            return law
        # 2. Exakter Abkürzungs-Match (z. B. ABGB, MRG, WEG, B-VG)
        clean_abbr = re.sub(r"[^a-z0-9]", "", law.get("abbreviation", "").lower())
        if clean_abbr == norm_query:
            return law
        # 3. Gesetzesnummer-Match
        if str(law.get("gesetzesnummer", "")) == query.strip():
            return law
        # 4. Aliase prüfen
        for alias in law.get("aliases", []):
            clean_alias = re.sub(r"[^a-z0-9]", "", alias.lower())
            if clean_alias == norm_query:
                return law

    return None


def extract_node_text(node: ET.Element) -> str:
    """
    Extrahiert den bereinigten Text eines XML-Knotens inklusive Kind-Tags
    und löst RIS-Spezialelemente wie <gdash />, <gldsym>, <tab> auf.
    """
    parts: List[str] = []

    def _walk(el: ET.Element):
        tag = _clean_tag(el.tag)
        if tag == "gdash":
            parts.append("-")
        elif tag == "tab":
            parts.append(" ")

        if el.text:
            parts.append(el.text)

        for child in el:
            _walk(child)
            if child.tail:
                parts.append(child.tail)

    _walk(node)
    text = "".join(parts)
    # Normale Whitespace-Bereinigung innerhalb von Absätzen
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def parse_ris_segment_xml(xml_content: str) -> NormSegment:
    """
    Parst den amtlichen RIS-XML-Baum eines Normabschnitts deterministisch in ein NormSegment.
    """
    root = ET.fromstring(xml_content)

    metadata: Dict[str, str] = {}
    content_blocks: List[str] = []

    # 1. Metadaten extrahieren
    for absatz in root.iter():
        tag = _clean_tag(absatz.tag)
        if tag == "absatz":
            ct = absatz.attrib.get("ct")
            if ct:
                metadata[ct] = extract_node_text(absatz)

    kurztitel = metadata.get("kurztitel", "Unbekanntes Gesetz")
    abkuerzung = metadata.get("abkuerzung", "")
    artikel_anlage = metadata.get("artikel_anlage", "")
    kundmachungsorgan = metadata.get("kundmachungsorgan", "")
    ikra = metadata.get("ikra")
    akra = metadata.get("akra")
    gesnr = metadata.get("gesnr", "")
    doknr = metadata.get("doknr", "")
    geaendert = metadata.get("geaendert") or metadata.get("fassung_vom")

    # 2. Textinhalt aus <nutzdaten> / <abschnitt> extrahieren
    nutzdaten = None
    for el in root:
        if _clean_tag(el.tag) == "nutzdaten":
            nutzdaten = el
            break

    search_container = nutzdaten if nutzdaten is not None else root

    for elem in search_container.iter():
        tag = _clean_tag(elem.tag)

        # Überschriften
        if tag == "ueberschrift":
            typ = elem.attrib.get("typ")
            text = extract_node_text(elem)
            if text:
                if typ == "para":
                    content_blocks.append(f"## {text}\n")
                elif typ == "titel" and elem.attrib.get("ct") == "text":
                    content_blocks.append(f"### {text}\n")

        # Standard-Absätze
        elif tag == "absatz":
            typ = elem.attrib.get("typ")
            ct = elem.attrib.get("ct")
            if typ in ("abs", "erltext") and ct == "text":
                text = extract_node_text(elem)
                if text:
                    content_blocks.append(f"{text}\n")

        # Listen & Aufzählungen
        elif tag == "listelem":
            if elem.attrib.get("ct") == "text":
                text = extract_node_text(elem)
                if text:
                    parent_ebene = 1
                    content_blocks.append(f"- {text}")

        # Schlussteil nach Listen
        elif tag == "schlussteil":
            if elem.attrib.get("ct") == "text":
                text = extract_node_text(elem)
                if text:
                    content_blocks.append(f"{text}\n")

    content = "\n".join(content_blocks).strip()
    if not content:
        # Fallback falls spezielle Struktur: alle absatz mit ct=text
        fallback_parts = []
        for el in root.iter():
            if _clean_tag(el.tag) == "absatz" and el.attrib.get("ct") == "text":
                t = extract_node_text(el)
                if t:
                    fallback_parts.append(t)
        content = "\n\n".join(fallback_parts).strip()

    source_id = doknr or metadata.get("dokumentnummer") or "UNSPECIFIED"

    return NormSegment(
        source_id=source_id,
        gesetzesnummer=gesnr,
        dokumentnummer=doknr,
        kurztitel=kurztitel,
        abkuerzung=abkuerzung,
        artikel_anlage=artikel_anlage,
        kundmachungsorgan=kundmachungsorgan,
        ikra=ikra,
        akra=akra,
        fassung_vom=geaendert,
        content=content,
        raw_xml=xml_content,
        eli=None,
    )


def fetch_url_text(url: str, timeout: int = DEFAULT_TIMEOUT) -> str:
    """Führt einen HTTP-GET-Request mit Standard-Headers aus."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def fetch_segment_xml_by_id(source_id: str, timeout: int = DEFAULT_TIMEOUT) -> str:
    """
    Lädt das amtliche RIS-XML für eine Dokumentnummer (z. B. NOR40258475).
    Versucht Bundesnormen, danach Landesnormen.
    """
    clean_id = source_id.strip()
    bund_url = f"{RIS_BUND_XML_BASE}/{clean_id}/{clean_id}.xml"

    try:
        return fetch_url_text(bund_url, timeout=timeout)
    except Exception:
        land_url = f"{RIS_LAND_XML_BASE}/{clean_id}/{clean_id}.xml"
        return fetch_url_text(land_url, timeout=timeout)


def search_ris_ogd_api(
    query: Optional[str] = None,
    gesetzesnummer: Optional[str] = None,
    paragraph: Optional[str] = None,
    scope: str = "bund",
    timeout: int = DEFAULT_TIMEOUT,
    max_pages: int = 5,
) -> List[Dict[str, Any]]:
    """
    Sucht Normen über die offizielle OGD REST API v2.6 des Bundeskanzleramts.
    Liefert eine Liste gefundener Treffer mit Dokument-Referenzen zurück.
    """
    api_url = RIS_BUNDESRECHT_API if scope == "bund" else RIS_LANDESRECHT_API
    base_params = {
        "Applikation": "BrKons" if scope == "bund" else "LrKons",
        "ImRisSeit": "Undefined",
    }

    if gesetzesnummer:
        base_params["Gesetzesnummer"] = gesetzesnummer

    clean_para = ""
    if paragraph:
        clean_para = re.sub(r"^[§\s\.]+", "", paragraph.strip())
        num_m = re.match(r"^(\d+[a-z]?)", clean_para, re.IGNORECASE)
        if num_m:
            base_params["Suchworte"] = num_m.group(1)

    if query and not gesetzesnummer:
        base_params["Titel"] = query

    results: List[Dict[str, Any]] = []

    for page in range(1, max_pages + 1):
        params = dict(base_params)
        params["Seitennummer"] = str(page)

        full_url = f"{api_url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            full_url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            break

        doc_results = data.get("OgdSearchResult", {}).get("OgdDocumentResults", {})
        doc_refs = doc_results.get("OgdDocumentReference", [])
        if not doc_refs:
            break
        if isinstance(doc_refs, dict):
            doc_refs = [doc_refs]

        page_matched = False
        for ref in doc_refs:
            d_data = ref.get("Data", {})
            meta = d_data.get("Metadaten", {})
            tech = meta.get("Technisch", {})
            allg = meta.get("Allgemein", {})
            bund = meta.get("Bundesrecht", {})
            br_kons = bund.get("BrKons", {})

            # XML-URL ermitteln
            xml_url = None
            doc_list = d_data.get("Dokumentliste", {})
            content_ref = doc_list.get("ContentReference", {})
            if isinstance(content_ref, list):
                content_ref = content_ref[0] if content_ref else {}
            urls = content_ref.get("Urls", {}).get("ContentUrl", [])
            if isinstance(urls, dict):
                urls = [urls]
            for u in urls:
                if u.get("DataType", "").lower() == "xml":
                    xml_url = u.get("Url")
                    break

            hit_entry = {
                "source_id": tech.get("ID", ""),
                "dokumentnummer": tech.get("ID", ""),
                "gesetzesnummer": br_kons.get("Gesetzesnummer", ""),
                "title": bund.get("Kurztitel", ""),
                "paragraph": br_kons.get("ArtikelParagraphAnlage", ""),
                "paragraph_number": br_kons.get("Paragraphnummer", ""),
                "document_url": allg.get("DokumentUrl", ""),
                "xml_url": xml_url,
            }
            results.append(hit_entry)

            # Wenn wir nach einem Paragrafen suchen und ihn finden
            if paragraph and clean_para:
                hit_p = hit_entry["paragraph"].replace(" ", "").lower()
                target_p = f"§{clean_para}".lower()
                if hit_p == target_p:
                    page_matched = True

        # Wenn wir Treffer für den gesuchten Paragrafen auf dieser Seite gefunden haben
        # und die Folgeseite wahrscheinlich andere Paragrafen hat, können wir abbrechen
        if paragraph and page_matched and page > 1:
            break

    return results


def fetch_norm(
    law_query: str,
    paragraph_query: str,
    cache: AtomicDiskCache,
    stichtag: Optional[str] = None,
    canonical_path: Optional[Path] = None,
    force_refresh: bool = False,
) -> Tuple[Optional[NormSegment], Optional[VerificationReceipt], bool]:
    """
    Hauptfunktion: Lädt, verifiziert und parst einen Paragrafen eines österreichischen Gesetzes.
    1. Schneller Look-up im kanonischen Katalog
    2. Cache-Abfrage
    3. Abruf via RIS OGD API / Direkt-XML
    4. Determinismus & Verification Receipt
    Gibt (NormSegment, VerificationReceipt, was_cached) zurück.
    """
    canonical = resolve_canonical_law(law_query, canonical_path)
    clean_law = canonical["slug"] if canonical else law_query.strip().lower()

    # Paragraf normalisieren
    clean_para = paragraph_query.strip()
    if not clean_para.startswith("§") and not clean_para.lower().startswith("art"):
        clean_para = f"§ {clean_para}"

    stichtag_iso = parse_date_to_iso(stichtag) or get_vienna_today_iso()
    clean_para_slug = re.sub(r"[^a-zA-Z0-9]+", "_", clean_para).strip("_")
    cache_key = f"{clean_law}_{clean_para_slug}_{stichtag_iso}.xml"

    # Cache prüfen
    if not force_refresh and cache.has(cache_key):
        cached_xml = cache.get_text(cache_key)
        if cached_xml:
            norm = parse_ris_segment_xml(cached_xml)
            receipt = create_verification_receipt(
                norm,
                stichtag=stichtag_iso,
                cached=True,
                retrieval_method="cached_disk"
            )
            return norm, receipt, True

    # Wenn direkte SourceId (NOR... / LOO...)
    raw_xml: Optional[str] = None
    if law_query.upper().startswith(("NOR", "LOO")):
        raw_xml = fetch_segment_xml_by_id(law_query.upper())
    else:
        # RIS OGD Suche
        gesnr = canonical.get("gesetzesnummer") if canonical else None
        hits = search_ris_ogd_api(
            query=canonical.get("title") if not gesnr else None,
            gesetzesnummer=gesnr,
            paragraph=clean_para,
            scope="bund",
        )

        matching_hits = [
            hit for hit in hits
            if hit.get("paragraph", "").replace(" ", "").lower() == clean_para.replace(" ", "").lower()
        ]
        # Neueste Normfassung bevorzugen (höchste NOR-ID = jüngste Novelle)
        matching_hits.sort(key=lambda h: h.get("source_id", ""), reverse=True)

        target_source_id = matching_hits[0].get("source_id") if matching_hits else None
        if not target_source_id and hits:
            target_source_id = hits[0].get("source_id")

        if target_source_id:
            raw_xml = fetch_segment_xml_by_id(target_source_id)

    if not raw_xml:
        return None, None, False

    # Rohquelle archivieren
    raw_path, raw_sha = cache.archive_raw_source(raw_xml, ext="xml")

    # In Disk-Cache schreiben
    cache.put_text(cache_key, raw_xml)

    # Parsen & Receipt erstellen
    norm = parse_ris_segment_xml(raw_xml)
    receipt = create_verification_receipt(
        norm,
        stichtag=stichtag_iso,
        cached=False,
        retrieval_method="ris_xml_direct",
        raw_source_path=str(raw_path.relative_to(cache.data_dir))
    )

    return norm, receipt, False
