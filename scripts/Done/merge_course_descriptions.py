"""Merge course narratives from CourseDescriptions.json into CourseDescriptions(Export).json.

Writes `DegreeJSON/full Course Desription.json` by default.

Matching strategy:
- Primary: `course_identification` field on export file
- Fallback: `subject` + `course_number` (string concatenation)

Unmatched entries from the export file are still included. Unmatched entries from the source narrative file are appended (with a generated `course_identification` when possible).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Any, List


def key_for(rec: Dict[str, Any]) -> str | None:
    # Prefer explicit course_identification
    cid = rec.get("course_identification")
    if cid:
        return str(cid)
    subj = rec.get("subject")
    num = rec.get("course_number")
    if subj and num is not None:
        return f"{subj}{num}"
    return None


def merge(export_records: List[Dict[str, Any]], narrative_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Build mapping from narrative file
    narrative_map: Dict[str, Dict[str, Any]] = {}
    for r in narrative_records:
        k = key_for(r)
        if k:
            narrative_map[k] = r

    merged: List[Dict[str, Any]] = []
    used_keys = set()

    for rec in export_records:
        k = key_for(rec)
        combined = dict(rec)  # copy
        if k and k in narrative_map:
            # copy narrative field(s) over
            combined["course_text_narrative"] = narrative_map[k].get("course_text_narrative")
            used_keys.add(k)
        merged.append(combined)

    # Append narratives that weren't matched
    for k, r in narrative_map.items():
        if k in used_keys:
            continue
        # ensure minimal fields
        out = {
            "course_identification": k,
            "subject": r.get("subject"),
            "course_number": r.get("course_number"),
            "course_text_narrative": r.get("course_text_narrative"),
        }
        merged.append(out)

    return merged


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Merge course description JSON files")
    parser.add_argument("--export", default="DegreeJSON/CourseDescriptions(Export).json", help="Export JSON file (with course_identification)")
    parser.add_argument("--source", default="DegreeJSON/CourseDescriptions.json", help="Source JSON file with narratives")
    parser.add_argument("--output", default="DegreeJSON/full Course Desription.json", help="Merged output path")
    args = parser.parse_args(list(argv) if argv is not None else None)

    export_path = Path(args.export)
    source_path = Path(args.source)
    out_path = Path(args.output)

    if not export_path.exists():
        print(f"Export file not found: {export_path}")
        return 2
    if not source_path.exists():
        print(f"Source file not found: {source_path}")
        return 3

    export_data = json.loads(export_path.read_text(encoding="utf-8"))
    source_data = json.loads(source_path.read_text(encoding="utf-8"))

    merged = merge(export_data, source_data)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(merged)} merged records to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
