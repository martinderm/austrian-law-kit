#!/usr/bin/env python3
"""
austrian_law_cli.py — Zentraler CLI-Router für austrian-law-kit.

Befehle:
  fetch_norm        Holt eine Einzelnorm (z. B. § 29 MRG), validiert sie und erzeugt Receipt
  fetch_whole_law   Lädt die amtliche Gesamtfassung eines Gesetzes in den Cache
  search_law        Sucht nach Normen über die offizielle OGD RIS-API
  search_decisions  Sucht amtliche OGH-Entscheidungen über RIS-Justiz
  list_canonical    Listet alle 50+ vorindizierten österreichischen Bundesgesetze auf
  sync_laws         Führt Batch-Synchronisationen mehrerer Normen durch

Unterstützt --json für den standardisierten Structured CLI Envelope.
Zero pip dependencies (nur Python 3 stdlib).
"""

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

# Setup import path
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

from lib.receipt import format_5_layer_output
from lib.ris_judikatur import search_case_law
from lib.ris_ogd_client import (
    fetch_norm,
    fetch_segment_xml_by_id,
    resolve_canonical_law,
    search_ris_ogd_api,
)
from lib.storage import AtomicDiskCache


def get_default_cache_dir() -> Path:
    return SKILL_DIR / "data" / "cache"


def get_default_canonical_file() -> Path:
    return SKILL_DIR / "references" / "canonical-laws.json"


def output_envelope(
    action: str,
    success: bool,
    state: str,
    message: str,
    data=None,
    error=None,
    as_json: bool = False,
):
    """Gibt das Ergebnis im standardisierten Structured CLI Envelope aus."""
    envelope = {
        "action": action,
        "success": success,
        "state": state,
        "message": message,
        "data": data,
        "error": error,
    }
    if as_json:
        print(json.dumps(envelope, indent=2, ensure_ascii=False))
    else:
        if not success:
            print(f"FEHLER [{state}]: {message}", file=sys.stderr)
            if error:
                print(f"Details: {error}", file=sys.stderr)
        else:
            if isinstance(data, dict) and "formatted_output" in data:
                print(data["formatted_output"])
            elif isinstance(data, dict) and "guide_markdown" in data:
                print(data["guide_markdown"])
            elif isinstance(data, str):
                print(data)
            else:
                print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_fetch_norm(args) -> int:
    cache_dir = Path(args.cache_dir) if args.cache_dir else get_default_cache_dir()
    cache = AtomicDiskCache(cache_dir)
    canonical_file = get_default_canonical_file()

    try:
        norm, receipt, was_cached = fetch_norm(
            law_query=args.law,
            paragraph_query=args.paragraph,
            cache=cache,
            stichtag=args.stichtag,
            canonical_path=canonical_file,
            force_refresh=args.force_refresh,
        )
    except Exception as e:
        output_envelope(
            action="fetch_norm",
            success=False,
            state="fetch_error",
            message=f"Fehler beim Abruf von '{args.law} {args.paragraph}': {e}",
            error=str(e),
            as_json=args.json,
        )
        return 1

    if not norm or not receipt:
        output_envelope(
            action="fetch_norm",
            success=False,
            state="norm_not_found",
            message=f"Norm '{args.paragraph}' in Gesetz '{args.law}' nicht gefunden.",
            error="Norm not found in RIS",
            as_json=args.json,
        )
        return 2

    # Optional Judikatur laden
    decisions = []
    if args.include_decisions:
        decisions = search_case_law(
            norm=norm.abkuerzung or args.law,
            paragraph=norm.artikel_anlage or args.paragraph,
            court="OGH",
            limit=args.decisions_limit,
        )

    formatted_md = format_5_layer_output(norm, receipt, decisions)

    data_payload = {
        "receipt": asdict(receipt),
        "norm": asdict(norm),
        "decisions": [asdict(d) for d in decisions],
        "formatted_output": formatted_md,
    }

    output_envelope(
        action="fetch_norm",
        success=True,
        state=receipt.verification_status,
        message=f"{norm.kurztitel} {norm.artikel_anlage} erfolgreich verifiziert ({receipt.verification_status})",
        data=data_payload,
        as_json=args.json,
    )
    return 0


def cmd_fetch_whole_law(args) -> int:
    cache_dir = Path(args.cache_dir) if args.cache_dir else get_default_cache_dir()
    cache = AtomicDiskCache(cache_dir)
    canonical_file = get_default_canonical_file()

    law = resolve_canonical_law(args.law, canonical_file)
    slug = law["slug"] if law else args.law.strip().lower()
    gesnr = law["gesetzesnummer"] if law else args.law.strip()

    cache_key = f"{slug}_whole_law.html"

    if not args.force_refresh and cache.has(cache_key):
        output_envelope(
            action="fetch_whole_law",
            success=True,
            state="cached",
            message=f"Gesamtfassung von '{slug}' ist bereits im lokalen Cache vorhanden.",
            data={"slug": slug, "cache_path": str(cache.get_path(cache_key)), "cached": True},
            as_json=args.json,
        )
        return 0

    whole_url = f"https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer={gesnr}"
    if args.stichtag:
        whole_url += f"&FassungVom={args.stichtag}"

    try:
        import urllib.request
        req = urllib.request.Request(whole_url, headers={"User-Agent": "austrian-law-kit/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8", errors="replace")

        target_path = cache.put_text(cache_key, content)
        output_envelope(
            action="fetch_whole_law",
            success=True,
            state="downloaded",
            message=f"Gesamtfassung von '{slug}' erfolgreich heruntergeladen und gecacht.",
            data={"slug": slug, "gesetzesnummer": gesnr, "cache_path": str(target_path), "cached": False},
            as_json=args.json,
        )
        return 0
    except Exception as e:
        output_envelope(
            action="fetch_whole_law",
            success=False,
            state="download_error",
            message=f"Fehler beim Laden der Gesamtfassung '{slug}': {e}",
            error=str(e),
            as_json=args.json,
        )
        return 1


def cmd_search_law(args) -> int:
    try:
        hits = search_ris_ogd_api(
            query=args.query,
            scope=args.scope,
            timeout=15,
        )
        output_envelope(
            action="search_law",
            success=True,
            state="search_complete",
            message=f"{len(hits)} Treffer für '{args.query}' im RIS gefunden.",
            data={"query": args.query, "hits": hits[:args.limit]},
            as_json=args.json,
        )
        return 0
    except Exception as e:
        output_envelope(
            action="search_law",
            success=False,
            state="search_error",
            message=f"Fehler bei der RIS-Suche nach '{args.query}': {e}",
            error=str(e),
            as_json=args.json,
        )
        return 1


def cmd_search_decisions(args) -> int:
    try:
        decisions = search_case_law(
            query=args.query,
            norm=args.norm,
            paragraph=args.paragraph,
            court=args.court,
            limit=args.limit,
        )
        output_envelope(
            action="search_decisions",
            success=True,
            state="decisions_found",
            message=f"{len(decisions)} amtliche Entscheidungen im RIS gefunden.",
            data={"query": args.query, "court": args.court, "decisions": [asdict(d) for d in decisions]},
            as_json=args.json,
        )
        return 0
    except Exception as e:
        output_envelope(
            action="search_decisions",
            success=False,
            state="decision_search_error",
            message=f"Fehler bei der Rechtsprechungs-Recherche: {e}",
            error=str(e),
            as_json=args.json,
        )
        return 1


def cmd_list_canonical(args) -> int:
    canonical_file = get_default_canonical_file()
    if not canonical_file.is_file():
        output_envelope(
            action="list_canonical",
            success=False,
            state="file_missing",
            message="Kanonischer Katalog nicht gefunden.",
            error="canonical-laws.json missing",
            as_json=args.json,
        )
        return 1

    try:
        laws = json.loads(canonical_file.read_text(encoding="utf-8"))
        output_envelope(
            action="list_canonical",
            success=True,
            state="success",
            message=f"{len(laws)} kanonische österreichische Bundesgesetze vorindiziert.",
            data={"total": len(laws), "laws": laws},
            as_json=args.json,
        )
        return 0
    except Exception as e:
        output_envelope(
            action="list_canonical",
            success=False,
            state="parse_error",
            message=f"Fehler beim Lesen des Katalogs: {e}",
            error=str(e),
            as_json=args.json,
        )
        return 1


def cmd_migration_guide(args) -> int:
    guide_path = SKILL_DIR / "docs" / "migration-guide.md"
    content = ""
    if guide_path.is_file():
        content = guide_path.read_text(encoding="utf-8")
    else:
        content = "Migrationsanleitung unter docs/migration-guide.md nicht gefunden."

    output_envelope(
        action="migration_guide",
        success=True,
        state="success",
        message="Migrationsanleitung für austrian-law-kit",
        data={"guide_markdown": content},
        as_json=args.json,
    )
    return 0


def main():
    parser = argparse.ArgumentParser(
        prog="austrian_law_cli.py",
        description="austrian-law-kit — Python 3 CLI für österreichische Rechtsrecherche",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. fetch_norm
    p_fn = subparsers.add_parser("fetch_norm", help="Einzelnorm abrufen, verifizieren & Receipt erzeugen")
    p_fn.add_argument("--law", required=True, help="Gesetz (z. B. 'mrg', 'abgb', 'weg', oder Dokumentnummer 'NOR40258475')")
    p_fn.add_argument("--paragraph", required=True, help="Paragraf (z. B. '§ 29', '1293')")
    p_fn.add_argument("--stichtag", help="Prüfstichtag (YYYY-MM-DD)")
    p_fn.add_argument("--include-decisions", action="store_true", help="Amtliche OGH-Rechtsprechung beifügen")
    p_fn.add_argument("--decisions-limit", type=int, default=3, help="Max. Anzahl Judikaturtreffer (Default: 3)")
    p_fn.add_argument("--force-refresh", action="store_true", help="Cache ignorieren und neu laden")
    p_fn.add_argument("--cache-dir", help="Benutzerdefinierter Cache-Ordner")
    p_fn.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    # 2. fetch_whole_law
    p_fw = subparsers.add_parser("fetch_whole_law", help="Amtliche Gesamtfassung eines Gesetzes herunterladen")
    p_fw.add_argument("--law", required=True, help="Gesetz (Kürzel, Slug oder Gesetzesnummer)")
    p_fw.add_argument("--stichtag", help="Fassungsstand / Stichtag (YYYY-MM-DD)")
    p_fw.add_argument("--force-refresh", action="store_true", help="Cache ignorieren")
    p_fw.add_argument("--cache-dir", help="Benutzerdefinierter Cache-Ordner")
    p_fw.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    # 3. search_law
    p_sl = subparsers.add_parser("search_law", help="Normsuche über die offizielle OGD RIS-API")
    p_sl.add_argument("--query", required=True, help="Suchbegriff oder Normtitel")
    p_sl.add_argument("--scope", default="bund", choices=["bund", "land"], help="Rechtsbereich (bund oder land)")
    p_sl.add_argument("--limit", type=int, default=5, help="Maximale Trefferanzahl")
    p_sl.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    # 4. search_decisions
    p_sd = subparsers.add_parser("search_decisions", help="Amtliche Rechtsprechung (OGH) aus RIS-Justiz suchen")
    p_sd.add_argument("--query", help="Suchbegriff / Freitext")
    p_sd.add_argument("--norm", help="Normkürzel (z. B. MRG, ABGB)")
    p_sd.add_argument("--paragraph", help="Paragraf (z. B. '§ 29')")
    p_sd.add_argument("--court", default="OGH", help="Gericht (Default: OGH)")
    p_sd.add_argument("--limit", type=int, default=3, help="Maximale Trefferanzahl")
    p_sd.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    # 5. list_canonical
    p_lc = subparsers.add_parser("list_canonical", help="Vorindizierte Kern-Bundesgesetze auflisten")
    p_lc.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    # 6. migration_guide
    p_mg = subparsers.add_parser("migration_guide", help="Kurze Migrationsanleitung für bestehende Workspaces anzeigen")
    p_mg.add_argument("--json", action="store_true", help="Ausgabe als Structured JSON Envelope")

    args = parser.parse_args()

    dispatch = {
        "fetch_norm": cmd_fetch_norm,
        "fetch_whole_law": cmd_fetch_whole_law,
        "search_law": cmd_search_law,
        "search_decisions": cmd_search_decisions,
        "list_canonical": cmd_list_canonical,
        "migration_guide": cmd_migration_guide,
    }

    fn = dispatch.get(args.command)
    if fn:
        sys.exit(fn(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
