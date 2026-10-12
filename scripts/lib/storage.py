"""
storage.py — Atomarer Disk-Cache und Dateispeicher für austrian-law-kit.

Implementiert unterbrechungsfreies, sicheres Schreiben (tempfile + os.replace)
und Pfad-Layouts für Normtexte, Receipts und Rohquellen-Archive.
Zero pip dependencies (nur Python 3 stdlib).
"""

import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


class AtomicDiskCache:
    """
    Thread- und prozesssicherer lokaler Festplatten-Cache mit atomaren Schreiboperationen.
    """

    def __init__(self, cache_dir: Path, data_dir: Optional[Path] = None):
        self.cache_dir = Path(cache_dir).resolve()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        if data_dir:
            self.data_dir = Path(data_dir).resolve()
        else:
            self.data_dir = self.cache_dir.parent / "data"
        self.raw_dir = self.data_dir / "ris" / "raw"
        self.raw_dir.mkdir(parents=True, exist_ok=True)

    def get_path(self, key: str) -> Path:
        """Gibt den Pfad für einen Cache-Schlüssel zurück."""
        clean_key = key.replace("/", "_").replace("\\", "_")
        return self.cache_dir / clean_key

    def has(self, key: str) -> bool:
        """Prüft, ob der Schlüssel im Cache existiert."""
        path = self.get_path(key)
        return path.is_file() and path.stat().st_size > 0

    def get_text(self, key: str) -> Optional[str]:
        """Liest Text aus dem Cache."""
        path = self.get_path(key)
        if not path.is_file():
            return None
        try:
            return path.read_text(encoding="utf-8")
        except Exception:
            return None

    def put_text(self, key: str, content: str) -> Path:
        """
        Schreibt Text atomar in den Cache (tempfile + os.replace).
        Verhindert korrupte oder halb geschriebene Dateien.
        """
        target_path = self.get_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # In dasselbe Verzeichnis schreiben, damit os.replace ein simples Rename auf demselben Mount ist
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=target_path.parent, delete=False) as tf:
            tf.write(content)
            temp_path = Path(tf.name)

        # Retry bei Windows-Dateisperren
        for attempt in range(3):
            try:
                os.replace(temp_path, target_path)
                break
            except (PermissionError, OSError):
                if attempt == 2:
                    temp_path.unlink(missing_ok=True)
                    raise
                time.sleep(0.05)

        return target_path

    def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Liest ein JSON-Objekt aus dem Cache."""
        text = self.get_text(key)
        if text is None:
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None

    def put_json(self, key: str, data: Any) -> Path:
        """Schreibt ein JSON-Objekt atomar in den Cache."""
        content = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        return self.put_text(key, content)

    def archive_raw_source(self, raw_content: str, ext: str = "xml") -> Tuple[Path, str]:
        """
        Archiviert die unveränderte Upstream-Rohquelle sha-adressiert unter data/ris/raw/<sha256>.<ext>.
        Dedupliziert automatisch über den SHA-256 Hash.
        Gibt (Dateipfad, SHA-256) zurück.
        """
        sha = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()
        clean_ext = ext.lstrip(".")
        target_path = self.raw_dir / f"{sha}.{clean_ext}"

        if not target_path.exists():
            with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=self.raw_dir, delete=False) as tf:
                tf.write(raw_content)
                temp_path = Path(tf.name)
            for attempt in range(3):
                try:
                    os.replace(temp_path, target_path)
                    break
                except (PermissionError, OSError):
                    if attempt == 2:
                        temp_path.unlink(missing_ok=True)
                        raise
                    time.sleep(0.05)

        return target_path, sha
