#!/usr/bin/env python3
"""Small dependency-free integrity check for BDFA's static frontend."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for attribute in ("src", "href", "poster"):
            value = values.get(attribute)
            if value:
                self.references.append((attribute, value.strip()))
        srcset = values.get("srcset")
        if srcset:
            for candidate in srcset.split(","):
                url = candidate.strip().split(" ", 1)[0]
                if url:
                    self.references.append(("srcset", url))


def local_target(document: Path, raw_value: str) -> Path | None:
    if not raw_value or raw_value.startswith("#") or "{{" in raw_value or "${" in raw_value:
        return None
    parsed = urlsplit(raw_value)
    if parsed.scheme.lower() in IGNORED_SCHEMES or parsed.netloc:
        return None
    clean_path = unquote(parsed.path)
    if not clean_path or clean_path == "/":
        return None
    if clean_path.startswith("/"):
        return ROOT / clean_path.lstrip("/")
    return document.parent / clean_path


def main() -> int:
    index = ROOT / "index.html"
    if not index.is_file():
        print("Static check failed: index.html is missing.", file=sys.stderr)
        return 1

    html_files = sorted(ROOT.rglob("*.html"))
    missing: list[str] = []
    parse_errors: list[str] = []

    for html_file in html_files:
        parser = AssetParser()
        try:
            parser.feed(html_file.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            parse_errors.append(f"{html_file.relative_to(ROOT)}: {exc}")
            continue

        for attribute, reference in parser.references:
            target = local_target(html_file, reference)
            if target is None:
                continue
            if not target.exists():
                missing.append(
                    f"{html_file.relative_to(ROOT)} [{attribute}={reference!r}] -> "
                    f"{target.relative_to(ROOT) if target.is_relative_to(ROOT) else target}"
                )

    if parse_errors or missing:
        if parse_errors:
            print("Unreadable HTML files:", file=sys.stderr)
            for item in parse_errors:
                print(f"  - {item}", file=sys.stderr)
        if missing:
            print("Missing local assets referenced by HTML:", file=sys.stderr)
            for item in missing:
                print(f"  - {item}", file=sys.stderr)
        return 1

    print(f"Checked {len(html_files)} HTML file(s); all local asset references resolve.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
