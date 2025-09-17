# Simple script to convert output/ollama_course_skills.json (course-centric)
# into a skill-centric index file output/skills_index.json
#
# Run:
#   py -3 .\scripts\build_skills_index.py
# or specify input/output:
#   py -3 .\scripts\build_skills_index.py --in ".\output\ollama_course_skills.json" --out ".\output\skills_index.json"

import json
from pathlib import Path
import argparse
import hashlib

DEFAULT_IN = Path(r"d:\Projects\Web\SkillTrees\output\ollama_course_skills.json")
DEFAULT_OUT = Path(r"d:\Projects\Web\SkillTrees\output\skills_index.json")


def make_skill_id(label: str, description: str) -> str:
    """Deterministic short id from label+description."""
    h = hashlib.sha1((label.strip() + "\n" + description.strip()).encode("utf-8")).hexdigest()
    return "SKL-" + h[:10].upper()


def normalize_text(s: str) -> str:
    return " ".join(s.strip().split())


def build_index(data):
    skills = {}  # key -> {id,label,description,courses:set}
    for course in data:
        cid = course.get("course_identification") or course.get("course_id") or course.get("course_ident") or ""
        title = course.get("title_short_desc") or ""
        for s in course.get("inferred_skills", []):
            label = normalize_text(s.get("label", "") or "")
            desc = normalize_text(s.get("description", "") or "")

            if not label and not desc:
                continue

            key = (label.lower(), desc.lower())
            if key not in skills:
                sid = make_skill_id(label or desc[:40], desc)
                skills[key] = {
                    "skill_id": sid,
                    "label": label or desc[:40],
                    "description": desc,
                    "courses": []
                }
            # attach course id (avoid duplicates)
            if cid and cid not in skills[key]["courses"]:
                skills[key]["courses"].append(cid)

    # convert to list and sort by times used (descending) then label
    skill_list = list(skills.values())
    skill_list.sort(key=lambda x: (-len(x["courses"]), x["label"].lower()))
    # add course_count for convenience
    for item in skill_list:
        item["course_count"] = len(item["courses"])
    return skill_list


def main():
    p = argparse.ArgumentParser(description="Build skill-centric index from ollama_course_skills.json")
    p.add_argument("--in", dest="infile", default=str(DEFAULT_IN))
    p.add_argument("--out", dest="outfile", default=str(DEFAULT_OUT))
    args = p.parse_args()

    infile = Path(args.infile)
    outfile = Path(args.outfile)
    if not infile.exists():
        print(f"Input not found: {infile}")
        return

    try:
        data = json.loads(infile.read_text(encoding="utf-8"))
    except Exception as e:
        print("Failed to read/parse input JSON:", e)
        return

    skills = build_index(data)

    outfile.parent.mkdir(parents=True, exist_ok=True)
    outfile.write_text(json.dumps(skills, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {len(skills)} unique skills to {outfile}")
    # optional quick stats
    most_used = sorted(skills, key=lambda x: -x["course_count"])[:10]
    if most_used:
        print("Top skills (skill_id, count, label):")
        for s in most_used[:10]:
            print(f"  {s['skill_id']}\t{s['course_count']}\t{s['label']}")


if __name__ == "__main__":
    main()