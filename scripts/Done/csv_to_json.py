"""CSV -> JSON converter.

Usage (PowerShell):
  py .\scripts\csv_to_json.py --input "DegreeJSON/CourseDescriptions(Export).csv" --output "DegreeJSON/CourseDescriptions.json"

Features:
- Reads a CSV with header row and produces a JSON array of objects.
- CLI args: --input, --output, --delimiter, --encoding, --indent
- Small heuristics to coerce numeric-looking fields to int/float.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List


def normalize_header(h: str) -> str:
    # normalize header names to simple snake_case
    return (
        h.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )


def coerce_value(v: str) -> Any:
    # Accept lists/dicts/other types coming from csv parsing; normalize to string when appropriate
    if v is None:
        return None
    # If the CSV parser returned a list (duplicate headers or other), join with a single space
    if isinstance(v, list):
        v = " ".join(str(x) for x in v)
    # If non-str (e.g., number) convert to str for trimming/coercion
    if not isinstance(v, str):
        v = str(v)
    v = v.strip()
    if v == "":
        return None
    # try int
    try:
        if v.isdigit() or (v.startswith("-") and v[1:].isdigit()):
            return int(v)
    except Exception:
        pass
    # try float
    try:
        if any(ch in v for ch in ".eE"):
            f = float(v)
            return f
    except Exception:
        pass
    return v


def convert_csv_to_json(
    input_path: Path, output_path: Path, delimiter: str = ",", encoding: str = "utf-8", indent: int | None = 2
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with input_path.open("r", encoding=encoding, newline="") as fh:
        # Sniff dialect for common CSV oddities
        sample = fh.read(8192)
        fh.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
            # override delimiter if explicitly passed
            dialect.delimiter = delimiter or dialect.delimiter
        except Exception:
            dialect = csv.get_dialect("excel")
            dialect.delimiter = delimiter

        reader = csv.DictReader(fh, dialect=dialect)
        # normalize fieldnames
        if reader.fieldnames:
            headers = [normalize_header(h) for h in reader.fieldnames]
        else:
            headers = []

        for r in reader:
            obj: Dict[str, Any] = {}
            for raw_k, raw_v in r.items():
                k = normalize_header(raw_k) if raw_k is not None else raw_k
                obj[k] = coerce_value(raw_v)
            rows.append(obj)

    # write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as out_f:
        json.dump(rows, out_f, indent=indent, ensure_ascii=False)

    return rows


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Convert CSV to JSON array of objects")
    parser.add_argument("--input", "-i", required=True, help="Input CSV file path")
    parser.add_argument("--output", "-o", required=True, help="Output JSON file path")
    parser.add_argument("--delimiter", "-d", default=",", help="CSV delimiter (default ',')")
    parser.add_argument("--encoding", default="utf-8", help="File encoding (default utf-8)")
    parser.add_argument("--indent", type=int, default=2, help="JSON indent (default 2)")

    args = parser.parse_args(list(argv) if argv is not None else None)
    inp = Path(args.input)
    out = Path(args.output)

    if not inp.exists():
        print(f"Input file does not exist: {inp}")
        return 2

    rows = convert_csv_to_json(inp, out, delimiter=args.delimiter, encoding=args.encoding, indent=args.indent)
    print(f"Wrote {len(rows)} records to {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
