"""
test_austrian_law_cli.py — Umfassende Offline-Unittests für austrian-law-kit.

Testet kanonischen Katalog, RIS-XML-Parsing, Verification Receipt v2,
Stichtagslogik und atomaren Disk-Cache vollständig deterministisch ohne Netzwerkzugriff.
Zero pip dependencies (nur Python 3 stdlib unittest).
"""

import json
import shutil
import tempfile
import unittest
from pathlib import Path

# Setup import path
TEST_DIR = Path(__file__).resolve().parent
SKILL_DIR = TEST_DIR.parent
SCRIPTS_DIR = SKILL_DIR / "scripts"

import sys
sys.path.insert(0, str(SCRIPTS_DIR))

from lib.receipt import (
    compute_sha256,
    create_verification_receipt,
    evaluate_stichtag_status,
    format_5_layer_output,
    get_vienna_today_iso,
    normalize_content,
    parse_date_to_iso,
    CourtDecision,
    NormSegment,
)
from lib.ris_ogd_client import parse_ris_segment_xml, resolve_canonical_law
from lib.storage import AtomicDiskCache


class TestCanonicalLaws(unittest.TestCase):
    """Testet den vorindizierten Katalog österreichischer Kern-Bundesgesetze."""

    def setUp(self):
        self.cat_path = SKILL_DIR / "references" / "canonical-laws.json"

    def test_canonical_catalog_exists_and_has_laws(self):
        self.assertTrue(self.cat_path.is_file())
        laws = json.loads(self.cat_path.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(laws), 50)

    def test_lookup_by_slug(self):
        mrg = resolve_canonical_law("mrg", self.cat_path)
        self.assertIsNotNone(mrg)
        self.assertEqual(mrg["abbreviation"], "MRG")
        self.assertEqual(mrg["gesetzesnummer"], "10002531")

        abgb = resolve_canonical_law("abgb", self.cat_path)
        self.assertIsNotNone(abgb)
        self.assertEqual(abgb["gesetzesnummer"], "10001622")

    def test_lookup_by_abbreviation(self):
        weg = resolve_canonical_law("WEG", self.cat_path)
        self.assertIsNotNone(weg)
        self.assertEqual(weg["slug"], "weg")
        self.assertEqual(weg["gesetzesnummer"], "20001921")

        bvg = resolve_canonical_law("B-VG", self.cat_path)
        self.assertIsNotNone(bvg)
        self.assertEqual(bvg["gesetzesnummer"], "10000138")

    def test_lookup_by_alias(self):
        law = resolve_canonical_law("mietrechtsgesetz", self.cat_path)
        self.assertIsNotNone(law)
        self.assertEqual(law["abbreviation"], "MRG")

    def test_lookup_by_gesetzesnummer(self):
        law = resolve_canonical_law("10002531", self.cat_path)
        self.assertIsNotNone(law)
        self.assertEqual(law["abbreviation"], "MRG")

    def test_lookup_unknown_returns_none(self):
        self.assertIsNone(resolve_canonical_law("unbekanntes_gesetz_xyz", self.cat_path))
        self.assertIsNone(resolve_canonical_law("", self.cat_path))


class TestRisXmlParser(unittest.TestCase):
    """Testet das native ElementTree XML-Parsing von echten RIS-Normauszügen."""

    def setUp(self):
        fixture_path = SKILL_DIR / "fixtures" / "ris" / "nor40258475-segment.xml"
        self.xml_content = fixture_path.read_text(encoding="utf-8")

    def test_parse_segment_metadata(self):
        norm = parse_ris_segment_xml(self.xml_content)

        self.assertEqual(norm.kurztitel, "Einkommensteuergesetz 1988")
        self.assertEqual(norm.abkuerzung, "EStG 1988")
        self.assertEqual(norm.artikel_anlage, "§ 67a")
        self.assertEqual(norm.doknr, "NOR40258475")
        self.assertEqual(norm.gesetzesnummer, "10004570")
        self.assertEqual(norm.ikra, "01.01.2024")
        self.assertEqual(norm.source_id, "NOR40258475")

    def test_parse_segment_content_hierarchy(self):
        norm = parse_ris_segment_xml(self.xml_content)

        # Überschrift vorhanden
        self.assertIn("## Start-Up-Mitarbeiterbeteiligung", norm.content)

        # Textabsätze vorhanden
        self.assertIn("geldwerte Vorteil", norm.content)
        self.assertIn("Kapitalanteilen", norm.content)

        # Listenpunkte extrahiert
        self.assertIn("- 1.", norm.content)
        self.assertIn("- 2.", norm.content)


class TestVerificationReceipt(unittest.TestCase):
    """Testet duale Hashes, Stichtagslogik und 5-Schichten-Formatierung."""

    def test_sha256_computation(self):
        h1 = compute_sha256("Test Text")
        h2 = compute_sha256("Test Text")
        self.assertEqual(h1, h2)
        self.assertNotEqual(h1, compute_sha256("Anderer Text"))

    def test_content_normalization(self):
        raw = "  Absatz 1.\r\n\r\n  Weiterer    Text.  \n"
        norm = normalize_content(raw)
        self.assertEqual(norm, "Absatz 1.\n\nWeiterer Text.")

    def test_stichtag_evaluation(self):
        today = get_vienna_today_iso()

        # Norm in Kraft seit 2024-01-01, unbefristet
        # 1. Stichtag = Heute -> verified_current
        status_today = evaluate_stichtag_status(today, "2024-01-01", None)
        self.assertEqual(status_today, "verified_current")

        # 2. Historischer Stichtag (2025-01-01) -> historical_valid_for_stichtag
        status_hist = evaluate_stichtag_status("2025-01-01", "2024-01-01", None)
        if "2025-01-01" == today:
            self.assertEqual(status_hist, "verified_current")
        else:
            self.assertEqual(status_hist, "historical_valid_for_stichtag")

        # 3. Stichtag vor Inkrafttreten (2023-01-01) -> stichtag_mismatch
        status_too_early = evaluate_stichtag_status("2023-01-01", "2024-01-01", None)
        self.assertEqual(status_too_early, "stichtag_mismatch")

        # 4. Stichtag nach Außerkrafttreten -> stichtag_mismatch
        status_repealed = evaluate_stichtag_status("2025-01-01", "2020-01-01", "2024-12-31")
        self.assertEqual(status_repealed, "stichtag_mismatch")

    def test_5_layer_output_formatting(self):
        norm = NormSegment(
            source_id="NOR40258475",
            gesetzesnummer="10004570",
            dokumentnummer="NOR40258475",
            kurztitel="Einkommensteuergesetz 1988",
            abkuerzung="EStG",
            artikel_anlage="§ 67a",
            kundmachungsorgan="BGBl. Nr. 400/1988",
            ikra="01.01.2024",
            akra=None,
            fassung_vom="17.01.2024",
            content="§ 67a. Start-Up-Mitarbeiterbeteiligung...",
            raw_xml="<xml></xml>",
        )
        receipt = create_verification_receipt(norm, stichtag="2024-06-01")
        decision = CourtDecision(
            case_number="5Ob121/08t",
            court="OGH",
            leitsatz="Rechtssatz zur Mitarbeiterbeteiligung.",
            decision_date="2008-10-15",
            rechtssatznummer="RS0123456",
        )

        output = format_5_layer_output(norm, receipt, [decision])

        self.assertIn("## A) Normwortlaut", output)
        self.assertIn("## B) Metadaten & Verification Receipt", output)
        self.assertIn("## C) Verständliche Zusammenfassung", output)
        self.assertIn("## D) Judikatur & Leitsätze", output)
        self.assertIn("## E) Schlussfolgerung & Rechtsunsicherheit", output)
        self.assertIn("5Ob121/08t", output)


class TestAtomicDiskCache(unittest.TestCase):
    """Testet unterbrechungsfreies, atomares Schreiben und Rohquellen-Archivierung."""

    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="austrian_law_test_"))
        self.cache = AtomicDiskCache(self.temp_dir / "cache", self.temp_dir / "data")

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_put_and_get_text(self):
        key = "test_key.txt"
        content = "Authentischer Gesetzestext § 1"
        saved_path = self.cache.put_text(key, content)

        self.assertTrue(saved_path.is_file())
        self.assertTrue(self.cache.has(key))
        self.assertEqual(self.cache.get_text(key), content)

    def test_put_and_get_json(self):
        key = "receipt.json"
        data = {"source_id": "NOR40258475", "status": "verified_current"}
        self.cache.put_json(key, data)

        loaded = self.cache.get_json(key)
        self.assertEqual(loaded, data)

    def test_archive_raw_source_and_deduplication(self):
        raw_xml = "<risdok>original xml stream</risdok>"
        path1, sha1 = self.cache.archive_raw_source(raw_xml, ext="xml")
        path2, sha2 = self.cache.archive_raw_source(raw_xml, ext="xml")

        self.assertEqual(path1, path2)
        self.assertEqual(sha1, sha2)
        self.assertTrue(path1.is_file())
        self.assertEqual(path1.read_text(encoding="utf-8"), raw_xml)


class TestFetchNormEndToEnd(unittest.TestCase):
    """Testet die fetch_norm-Pipeline mit gemocktem HTTP-Abruf."""

    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="austrian_law_e2e_"))
        self.cache = AtomicDiskCache(self.temp_dir / "cache", self.temp_dir / "data")
        fixture_path = SKILL_DIR / "fixtures" / "ris" / "nor40258475-segment.xml"
        self.xml_content = fixture_path.read_text(encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_fetch_norm_with_direct_source_id(self):
        from unittest.mock import patch
        from lib.ris_ogd_client import fetch_norm

        with patch("lib.ris_ogd_client.fetch_segment_xml_by_id", return_value=self.xml_content):
            norm, receipt, was_cached = fetch_norm(
                law_query="NOR40258475",
                paragraph_query="§ 67a",
                cache=self.cache,
                stichtag="2024-06-01",
            )

            self.assertIsNotNone(norm)
            self.assertIsNotNone(receipt)
            self.assertFalse(was_cached)
            self.assertEqual(norm.kurztitel, "Einkommensteuergesetz 1988")
            self.assertEqual(receipt.source_id, "NOR40258475")
            self.assertEqual(receipt.verification_status, "historical_valid_for_stichtag")
            self.assertTrue(self.cache.has("nor40258475_67a_2024-06-01.xml"))

            # Zweiter Abruf muss aus dem Cache kommen
            norm2, receipt2, was_cached2 = fetch_norm(
                law_query="NOR40258475",
                paragraph_query="§ 67a",
                cache=self.cache,
                stichtag="2024-06-01",
            )
            self.assertTrue(was_cached2)
            self.assertEqual(receipt2.verification_status, "historical_valid_for_stichtag")


if __name__ == "__main__":
    unittest.main()
