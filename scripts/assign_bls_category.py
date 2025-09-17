#!/usr/bin/env python3
"""
assign_bls_category.py

Reads:
 - output/ollama_course_skills_mapped.json
 - UCOInfo/CourseDescriptions(Export).json
 - BLSData/BLS_Skills_Categories.json

For each course in ollama_course_skills_mapped.json, finds the matching
course in CourseDescriptions(Export).json by `course_identification`, extracts
`course_text_narrative`, computes a simple token-overlap (Jaccard) similarity
against each BLS category (category name + description) and selects the best
matching BLS category. Writes a new file:
 - output/ollama_course_skills_with_bls.json

Usage:
    python scripts/assign_bls_category.py

This is a lightweight heuristic script — for better results use an embedding
or ML model to score semantic similarity.
"""
from __future__ import annotations

import json
import math
import os
import re
import sys
from collections import Counter
from typing import Dict, List, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
COURSES_PATH = os.path.join(ROOT, 'output', 'ollama_course_skills_mapped.json')
DESCRIPTION_PATH = os.path.join(ROOT, 'UCOInfo', 'CourseDescriptions(Export).json')
BLS_PATH = os.path.join(ROOT, 'BLSData', 'BLS_Skills_Categories.json')
OUT_PATH = os.path.join(ROOT, 'output', 'ollama_course_skills_with_bls.json')


def load_json(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


_token_re = re.compile(r"\w+", re.UNICODE)
_stopwords = set([
    'the','and','or','of','in','to','a','an','for','with','on','by','is','are',
    'this','that','from','as','be','will','their','they','which','it','its',
    'students','student','course','courses','study','studies','including'
])


def tokenize(text: str) -> List[str]:
    if not text:
        return []
    toks = [t.lower() for t in _token_re.findall(text)]
    toks = [t for t in toks if t not in _stopwords and not t.isdigit()]
    return toks


def jaccard(a: List[str], b: List[str]) -> float:
    sa = set(a)
    sb = set(b)
    if not sa and not sb:
        return 0.0
    inter = sa & sb
    union = sa | sb
    return len(inter) / len(union)


def find_course_description_map(descriptions: List[Dict]) -> Dict[str, Dict]:
    m = {}
    for d in descriptions:
        key = d.get('course_identification')
        if key:
            m[key] = d
    return m


def main(argv=None):
    argv = argv or sys.argv[1:]

    print('Loading files...')
    courses = load_json(COURSES_PATH)
    descriptions = load_json(DESCRIPTION_PATH)
    bls = load_json(BLS_PATH)

    desc_map = find_course_description_map(descriptions)

    # prepare BLS token sets
    bls_tokens: List[Tuple[Dict, List[str]]] = []
    for entry in bls:
        text = ' '.join([str(entry.get('category','')), str(entry.get('description',''))])
        toks = tokenize(text)
        bls_tokens.append((entry, toks))

    out = []
    counts = Counter()
    for c in courses:
        cid = c.get('course_identification')
        desc = desc_map.get(cid, {})
        narrative = desc.get('course_text_narrative') or desc.get('course_description') or ''
        toks = tokenize(narrative)

        best = None
        best_score = -1.0
        for entry, btoks in bls_tokens:
            score = jaccard(toks, btoks)
            if score > best_score:
                best_score = score
                best = entry

        if best is None:
            chosen = {'id': None, 'category': 'Unknown', 'score': 0.0}
            counts['Unknown'] += 1
        else:
            chosen = {'id': best.get('id'), 'category': best.get('category'), 'score': round(float(best_score), 4)}
            counts[chosen['category']] += 1

        new_course = dict(c)
        new_course['bls_category'] = chosen
        out.append(new_course)

    # write output
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f'Wrote {len(out)} courses to {OUT_PATH}')
    print('Top assigned categories:')
    for cat, cnt in counts.most_common(15):
        print(f'  {cat}: {cnt}')


if __name__ == '__main__':
    main()
