#!/usr/bin/env python3
"""Clean DegreeJSON/degree_skills_test.json into a normalized file.

This script reads the test output produced by `extract_skills.py`, normalizes
skill strings (removes surrounding quotes/commas, parses JSON-like dicts), and
writes `DegreeJSON/degree_skills_test_clean.json`.
"""
import json
import ast
import re
from typing import List

IN_PATH = 'DegreeJSON/degree_skills_test.json'
OUT_PATH = 'DegreeJSON/degree_skills_test_clean.json'


def clean_skill_text(s: str) -> str:
    if s is None:
        return ''
    s = str(s).strip()
    # strip trailing commas
    s = s.rstrip(',').strip()
    # strip surrounding quotes
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()

    # try json
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            for k in ('skill', 'text', 'name'):
                if k in obj:
                    return str(obj[k]).strip()
            return ' '.join(str(v) for v in obj.values()).strip()
        if isinstance(obj, list):
            return ', '.join(str(x).strip() for x in obj)
    except Exception:
        pass

    # try python literal
    try:
        obj = ast.literal_eval(s)
        if isinstance(obj, dict):
            for k in ('skill', 'text', 'name'):
                if k in obj:
                    return str(obj[k]).strip()
            return ' '.join(str(v) for v in obj.values()).strip()
        if isinstance(obj, list):
            return ', '.join(str(x).strip() for x in obj)
    except Exception:
        pass

    # remove simple wrappers and common labels
    s = re.sub(r'^\s*[\{\[]\s*', '', s)
    s = re.sub(r'\s*[\}\]]\s*$', '', s)
    s = re.sub(r'^\s*(?:"?skill"?\s*:\s*)', '', s, flags=re.I)
    s = s.strip(' "\'\.,:')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def is_valid_skill(s: str) -> bool:
    if not s:
        return False
    t = s.strip()
    low = t.lower()
    bad = ['credit', 'credits', 'prereq', 'prerequisite', 'grade', 'enrollment', 'lecture', 'lab']
    for b in bad:
        if b in low:
            return False
    if len(t) < 2:
        return False
    words = low.split()
    if len(words) > 10:
        return False
    return True


def main():
    with open(IN_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    out = {'generated_at': data.get('generated_at'), 'courses': []}
    for c in data.get('courses', []):
        skills = c.get('skills', [])
        cleaned: List[str] = []
        for s in skills:
            cs = clean_skill_text(s)
            if is_valid_skill(cs):
                cleaned.append(cs)
        out['courses'].append({
            'course_id': c.get('course_id'),
            'subj': c.get('subj'),
            'num': c.get('num'),
            'title': c.get('title'),
            'skills': cleaned
        })

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f'Wrote cleaned output to {OUT_PATH} with {len(out["courses"]) } courses')


if __name__ == '__main__':
    main()
