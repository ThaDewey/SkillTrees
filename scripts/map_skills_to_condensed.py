import json
from pathlib import Path
from difflib import SequenceMatcher
import hashlib

ROOT = Path(r"d:\Projects\Web\SkillTrees")
IN_COURSES = ROOT / "output" / "ollama_course_skills.json"
CONDENSED = ROOT / "output" / "skills_index_condensed.json"
OUT_FILE = ROOT / "output" / "ollama_course_skills_mapped.json"
MAP_FILE = ROOT / "output" / "skill_mapping.json"
SKILL_LOOKUP_FILE = ROOT / "output" / "skill_lookup.json"

def normalize(s: str) -> str:
    return " ".join((s or "").strip().lower().split())

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

def make_skill_id(label: str, desc: str) -> str:
    h = hashlib.sha1((label + "\n" + desc).encode("utf-8")).hexdigest()
    return "SKL-" + h[:10].upper()

def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else []

def main():
    courses = load_json(IN_COURSES)
    condensed = load_json(CONDENSED)

    # build condensed lookup list
    condensed_list = []
    skill_lookup = {}  # skill_id -> {label, description}
    for c in condensed:
        sid = c.get("skill_id") or make_skill_id(c.get("label",""), c.get("description",""))
        label = c.get("label","")
        desc = c.get("description","")
        condensed_list.append({
            "skill_id": sid,
            "label": label,
            "description": desc,
            "norm_label": normalize(label),
            "norm_desc": normalize(desc)
        })
        skill_lookup[sid] = {"label": label, "description": desc}

    mapping = {}  # original text -> mapped skill_id + info

    mapped_courses = []
    for course in courses:
        new_skill_ids = []
        for s in course.get("inferred_skills", []):
            orig_label = (s.get("label","") or "").strip()
            orig_desc = (s.get("description","") or "").strip()
            norm_label = normalize(orig_label)
            norm_desc = normalize(orig_desc)

            best = None
            best_score = 0.0
            for c in condensed_list:
                score_label = similarity(norm_label, c["norm_label"]) if norm_label and c["norm_label"] else 0.0
                score_desc = similarity(norm_desc, c["norm_desc"]) if norm_desc and c["norm_desc"] else 0.0
                score = max(score_label, score_desc * 0.9)
                if score > best_score:
                    best_score = score
                    best = c

            if best and best_score >= 0.55:
                sid = best["skill_id"]
                mapping_key = f"{orig_label} || {orig_desc}"
                mapping[mapping_key] = {"skill_id": sid, "score": round(best_score,3), "mapped_label": best["label"]}
                # ensure lookup contains the condensed values
                skill_lookup.setdefault(sid, {"label": best["label"], "description": best["description"]})
            else:
                sid = make_skill_id(orig_label or orig_desc[:40], orig_desc)
                mapping_key = f"{orig_label} || {orig_desc}"
                mapping[mapping_key] = {"skill_id": sid, "score": round(best_score,3), "mapped_label": orig_label or orig_desc[:40], "note": "fallback"}
                # store original text in lookup for fallback id
                skill_lookup.setdefault(sid, {"label": orig_label or orig_desc[:40], "description": orig_desc})

            # avoid duplicates in same course
            if sid not in new_skill_ids:
                new_skill_ids.append(sid)

        out_course = {
            "course_identification": course.get("course_identification"),
            "title_short_desc": course.get("title_short_desc"),
            "inferred_skills": new_skill_ids
        }
        mapped_courses.append(out_course)

    # write outputs
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(mapped_courses, indent=2, ensure_ascii=False), encoding="utf-8")
    MAP_FILE.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    SKILL_LOOKUP_FILE.write_text(json.dumps(skill_lookup, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {len(mapped_courses)} courses to {OUT_FILE}")
    print(f"Wrote mapping details to {MAP_FILE}")
    print(f"Wrote skill lookup (skill_id -> label/description) to {SKILL_LOOKUP_FILE}")

if __name__ == "__main__":
    main()