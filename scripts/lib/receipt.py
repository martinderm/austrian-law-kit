"""
receipt.py — Verification Receipt (v2) und 5-Schichten-Ausgabeformat für austrian-law-kit.

Erzeugt kryptografische Prüfnachweise mit dualem SHA-256 (Roh- vs. Normalisiert),
Stichtagsvalidierung nach Europe/Vienna und strukturiertem 5-Schichten-Markdown.
Zero pip dependencies (nur Python 3 stdlib).
"""

import hashlib
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional

try:
    from zoneinfo import ZoneInfo
    VIENNA_TZ = ZoneInfo("Europe/Vienna")
except ImportError:
    VIENNA_TZ = None


def compute_sha256(text: str) -> str:
    """Berechnet den SHA-256 Hex-Digest eines Strings (UTF-8)."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalize_content(text: str) -> str:
    """
    Normalisiert Text für den Inhalts-Hash:
    - Vereinheitlicht Zeilenumbrüche (LF)
    - Reduziert mehrfache Leerzeichen
    - Trimming von führenden und nachfolgenden Whitespaces
    """
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in normalized.split("\n")]
    return "\n".join(lines).strip()


def get_vienna_now() -> datetime:
    """Liefert das aktuelle Datum und Uhrzeit in der Zeitzone Europe/Vienna."""
    if VIENNA_TZ:
        return datetime.now(VIENNA_TZ)
    return datetime.now()


def get_vienna_today_iso() -> str:
    """Liefert das heutige Datum in Europe/Vienna im Format YYYY-MM-DD."""
    return get_vienna_now().strftime("%Y-%m-%d")


def parse_date_to_iso(date_str: Optional[str]) -> Optional[str]:
    """
    Konvertiert DD.MM.YYYY oder YYYY-MM-DD in ISO YYYY-MM-DD.
    Liefert None bei ungültigem oder fehlendem Datum.
    """
    if not date_str:
        return None
    date_str = date_str.strip()
    # DD.MM.YYYY
    m = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", date_str)
    if m:
        d, mon, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return date(y, mon, d).isoformat()
        except ValueError:
            return None
    # YYYY-MM-DD
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", date_str)
    if m:
        y, mon, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return date(y, mon, d).isoformat()
        except ValueError:
            return None
    return None


@dataclass
class CourtDecision:
    """Strukturierte gerichtliche Entscheidung (OGH, VfGH, VwGH)."""
    case_number: str
    court: str
    leitsatz: str
    decision_date: Optional[str] = None
    rechtssatznummer: Optional[str] = None
    ecli: Optional[str] = None
    fundstellen: List[str] = field(default_factory=list)


@dataclass
class NormSegment:
    """Repräsentiert einen abgerufenen und verifizierten Paragrafen / Normabschnitt."""
    source_id: str
    gesetzesnummer: str
    dokumentnummer: str
    kurztitel: str
    abkuerzung: str
    artikel_anlage: str
    kundmachungsorgan: str
    ikra: Optional[str]
    akra: Optional[str]
    fassung_vom: Optional[str]
    content: str
    raw_xml: str
    eli: Optional[str] = None

    @property
    def doknr(self) -> str:
        return self.dokumentnummer


@dataclass
class VerificationReceipt:
    """
    Maschinenlesbarer Nachweis der Normintegrität (Receipt v2).
    """
    source_id: str
    gesetzesnummer: str
    dokumentnummer: str
    eli: Optional[str]
    paragraf: str
    consolidated_as_of: Optional[str]
    retrieved_at: str
    effective_from: Optional[str]
    effective_to: Optional[str]
    kundmachungsorgan: Optional[str]
    raw_content_sha256: str
    normalized_content_sha256: str
    cached: bool
    retrieval_method: str
    verification_status: str
    receipt_version: int = 2
    raw_source_path: Optional[str] = None


def evaluate_stichtag_status(
    stichtag_iso: str,
    effective_from_iso: Optional[str],
    effective_to_iso: Optional[str]
) -> str:
    """
    Ermittelt den Verifikationsstatus für den gegebenen Stichtag.
    Status-Codes:
    - verified_current: Am Stichtag gültig und Stichtag ist das heutige Datum.
    - historical_valid_for_stichtag: Am historischen Stichtag gültig gewesen.
    - stichtag_mismatch: Am Stichtag noch nicht oder nicht mehr in Kraft.
    - insufficient_metadata: Inkrafttreten fehlt in den RIS-Metadaten.
    """
    if not effective_from_iso:
        return "insufficient_metadata"

    today_iso = get_vienna_today_iso()

    # Noch nicht in Kraft
    if effective_from_iso > stichtag_iso:
        return "stichtag_mismatch"

    # Bereits außer Kraft getreten
    if effective_to_iso and effective_to_iso < stichtag_iso:
        return "stichtag_mismatch"

    if stichtag_iso == today_iso:
        return "verified_current"
    return "historical_valid_for_stichtag"


def create_verification_receipt(
    norm: NormSegment,
    stichtag: Optional[str] = None,
    cached: bool = False,
    retrieval_method: str = "ris_xml_direct",
    raw_source_path: Optional[str] = None
) -> VerificationReceipt:
    """Erzeugt das vollständige VerificationReceipt für ein NormSegment."""
    stichtag_iso = parse_date_to_iso(stichtag) or get_vienna_today_iso()
    ikra_iso = parse_date_to_iso(norm.ikra)
    akra_iso = parse_date_to_iso(norm.akra)
    fassung_iso = parse_date_to_iso(norm.fassung_vom)

    status = evaluate_stichtag_status(stichtag_iso, ikra_iso, akra_iso)

    raw_sha = compute_sha256(norm.raw_xml)
    norm_sha = compute_sha256(normalize_content(norm.content))
    retrieved_at = get_vienna_now().isoformat()

    return VerificationReceipt(
        source_id=norm.source_id,
        gesetzesnummer=norm.gesetzesnummer,
        dokumentnummer=norm.dokumentnummer,
        eli=norm.eli,
        paragraf=norm.artikel_anlage,
        consolidated_as_of=fassung_iso,
        retrieved_at=retrieved_at,
        effective_from=ikra_iso,
        effective_to=akra_iso,
        kundmachungsorgan=norm.kundmachungsorgan,
        raw_content_sha256=raw_sha,
        normalized_content_sha256=norm_sha,
        cached=cached,
        retrieval_method=retrieval_method,
        verification_status=status,
        receipt_version=2,
        raw_source_path=raw_source_path
    )


def format_5_layer_output(
    norm: NormSegment,
    receipt: VerificationReceipt,
    decisions: Optional[List[CourtDecision]] = None
) -> str:
    """
    Erzeugt die verbindliche 5-Schichten-Antwortstruktur für österreichische Rechtstexte:
    A) Normwortlaut
    B) Metadaten & Verification Receipt
    C) Verständliche Zusammenfassung (Paraphrase)
    D) Judikatur & Leitsätze (amtlich aus RIS Justiz)
    E) Schlussfolgerung & Rechtsunsicherheit
    """
    decisions = decisions or []

    # Layer A: Normwortlaut
    lines = [
        f"# {norm.kurztitel} — {norm.artikel_anlage}",
        "",
        "## A) Normwortlaut",
        "",
        norm.content.strip(),
        "",
    ]

    # Layer B: Metadaten & Receipt
    receipt_dict = asdict(receipt)
    lines.extend([
        "## B) Metadaten & Verification Receipt",
        "",
        "```json",
        json.dumps(receipt_dict, indent=2, ensure_ascii=False),
        "```",
        "",
    ])

    # Layer C: Paraphrase
    lines.extend([
        "## C) Verständliche Zusammenfassung (Paraphrase)",
        "",
        f"Regelt in {norm.kurztitel} ({norm.abkuerzung}) den Abschnitt {norm.artikel_anlage}. "
        f"Fassung in Kraft seit {receipt.effective_from or 'unbekannt'}"
        + (f" bis {receipt.effective_to}" if receipt.effective_to else " (aufrecht in Geltung)") + ".",
        "",
    ])

    # Layer D: Judikatur & Leitsätze
    lines.extend([
        "## D) Judikatur & Leitsätze (RIS-Justiz)",
        "",
    ])
    if decisions:
        for idx, dec in enumerate(decisions, 1):
            rs_info = f" (RS: {dec.rechtssatznummer})" if dec.rechtssatznummer else ""
            date_info = f" vom {dec.decision_date}" if dec.decision_date else ""
            lines.append(f"### {idx}. {dec.court} {dec.case_number}{date_info}{rs_info}")
            if dec.ecli:
                lines.append(f"- **ECLI:** `{dec.ecli}`")
            lines.append(f"\n{dec.leitsatz.strip()}\n")
    else:
        lines.append("*Keine spezifischen Leitentscheidungen im direkten Abruf beigefügt.*")
        lines.append("")

    # Layer E: Schlussfolgerung & Rechtsunsicherheit
    lines.extend([
        "## E) Schlussfolgerung & Rechtsunsicherheit",
        "",
        "- **Geltungsstatus:** "
        + ("Vollständig verifiziert und in aufrechter Geltung." if receipt.verification_status == "verified_current"
           else f"Status: {receipt.verification_status}"),
        "- **Rechtsberatungsgrenze:** Die Bereitstellung authentischer Gesetzestexte und Judikatur "
        "ersetzt keine juristische Einzelfallberatung.",
        ""
    ])

    return "\n".join(lines)
