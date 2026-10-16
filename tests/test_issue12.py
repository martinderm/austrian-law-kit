"""Offline regressions for GitHub issue #12 (synthetic XML, no legal evidence)."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from austrian_law_cli import get_default_cache_dir
from lib.ris_ogd_client import fetch_norm, search_ris_ogd_api
from lib.storage import AtomicDiskCache


def xml(source="NOR40195903", section="Art. 2 § 7", start="25.05.2018", end="", text="Fixture text"):
    fields = dict(doknr=source, gesnr="10001597", artikel_anlage=section,
                  ikra=start, akra=end)
    return '<risdok><nutzdaten>' + ''.join(
        f'<absatz ct="{key}">{value}</absatz>' for key, value in fields.items()
    ) + f'<absatz typ="abs" ct="text">{text}</absatz></nutzdaten></risdok>'


class Issue12(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.cache = AtomicDiskCache(self.root / "data" / "cache")

    def fetch(self, paragraph="7", date="2026-10-16"):
        return fetch_norm("dsg", paragraph, self.cache, stichtag=date)

    def test_no_fallback_to_unrelated_empty_fragment(self):
        with patch('lib.ris_ogd_client.search_ris_ogd_api', return_value=[
            dict(source_id="NOR11001619", paragraph="§ 0")
        ]), patch('lib.ris_ogd_client.fetch_segment_xml_by_id', return_value=xml(section="§ 0", text="")):
            self.assertIsNone(self.fetch()[0])

    def test_article_qualified_paragraph_and_poisoned_cache(self):
        self.cache.put_text('dsg_7_2026-10-16.xml', xml(section="§ 0", text=""))
        with patch('lib.ris_ogd_client.search_ris_ogd_api', return_value=[
            dict(source_id="NOR40195903", paragraph="Art. 2 § 7")
        ]), patch('lib.ris_ogd_client.fetch_segment_xml_by_id', return_value=xml()):
            norm, receipt, cached = self.fetch()
            self.assertEqual(norm.artikel_anlage, "Art. 2 § 7")
            self.assertFalse(cached)
            self.assertNotEqual(receipt.verification_status, 'stichtag_mismatch')

    def test_skip_expired_version_even_with_higher_id(self):
        hits = [dict(source_id=s, paragraph="§ 7") for s in ['NOR99999999', 'NOR40195903']]
        sources = {'NOR99999999': xml('NOR99999999', '§ 7', end='31.03.2005', start='01.01.2000'),
                   'NOR40195903': xml()}
        with patch('lib.ris_ogd_client.search_ris_ogd_api', return_value=hits), patch(
            'lib.ris_ogd_client.fetch_segment_xml_by_id', side_effect=sources.get
        ):
            self.assertEqual(self.fetch()[0].source_id, 'NOR40195903')
            self.assertEqual(self.fetch(date='2004-01-01')[0].source_id, 'NOR99999999')

    def test_xml_identity_checked_not_only_search_metadata(self):
        for bad in [xml(section='§ 70'), xml(text=''), xml().replace('10001597', '99999999')]:
            with self.subTest(xml=bad), patch('lib.ris_ogd_client.search_ris_ogd_api', return_value=[
                dict(source_id='NOR40195903', paragraph='§ 7')
            ]), patch('lib.ris_ogd_client.fetch_segment_xml_by_id', return_value=bad):
                self.assertIsNone(self.fetch()[0])

    def test_raw_layout_and_cached_receipt_resolve(self):
        with patch('lib.ris_ogd_client.fetch_segment_xml_by_id', return_value=xml()):
            for _ in range(2):
                norm, receipt, cached = fetch_norm('NOR40195903', '7', self.cache, stichtag='2026-10-16')
                path = self.root / receipt.raw_source_path
                self.assertEqual(path.parent, self.root / 'data/ris/raw')
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), receipt.raw_content_sha256)

    def test_default_cache_is_caller_workspace(self):
        with patch('pathlib.Path.cwd', return_value=self.root):
            self.assertEqual(get_default_cache_dir(), self.root / 'data/cache')

    def test_raw_hash_matches_bytes_with_crlf(self):
        content = '<xml>\r\nFixture\r\n</xml>'
        path, digest = self.cache.archive_raw_source(content)
        self.assertEqual(path.read_bytes(), content.encode('utf-8'))
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)

    def test_search_uses_date_not_fulltext_paragraph(self):
        response = MagicMock()
        response.read.return_value = json.dumps({'OgdSearchResult': {}}).encode()
        response.__enter__.return_value = response
        with patch('urllib.request.urlopen', return_value=response) as request:
            search_ris_ogd_api(gesetzesnummer='10001597', paragraph='7', stichtag='2004-01-01')
            params = parse_qs(urlparse(request.call_args.args[0].full_url).query)
            self.assertEqual(params['Fassung.FassungVom'], ['2004-01-01'])
            self.assertEqual(params['Abschnitt.Von'], ['7'])
            self.assertEqual(params['Abschnitt.Bis'], ['7'])
            self.assertEqual(params['Abschnitt.Typ'], ['Paragraph'])
            self.assertNotIn('Suchworte', params)
