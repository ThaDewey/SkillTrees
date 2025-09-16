"""Add `course_identification` field to course JSON records.

Usage:
  py .\scripts\add_course_identification.py --input DegreeJSON/CourseDescriptions(Export).json

This script will create a backup of the original file with a `.bak` suffix by default.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List, Dict, Any


def add_course_identification(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    for rec in records:
        subj = rec.get("subject")
        num = rec.get("course_number")
        # Convert number to string form; preserve letters like 'L' (labs)
        if num is None:
            cid = None
        else:
            num_str = str(num).strip()
            cid = f"{subj}{num_str}" if subj is not None else num_str
        rec["course_identification"] = cid
    return records


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Add course_identification to JSON course records")
    parser.add_argument("--input", "-i", required=True, help="Input JSON file path")
    parser.add_argument("--backup", action="store_true", help="Create a .bak backup of the input file")
    # When invoked programmatically pass argv list; otherwise let argparse read from sys.argv
    args = parser.parse_args(list(argv) if argv is not None else None)

    inp = Path(args.input)
    if not inp.exists():
        print(f"Input not found: {inp}")
        return 2

    original_text = inp.read_text(encoding="utf-8")
    data = json.loads(original_text)
    if not isinstance(data, list):
        print("Expected JSON array at top-level")
        return 3

    if args.backup:
        bak = inp.with_suffix(inp.suffix + ".bak")
        bak.write_text(original_text, encoding="utf-8")
        print(f"Backup written to {bak}")

    updated = add_course_identification(data)
    inp.write_text(json.dumps(updated, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {len(updated)} records in {inp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
