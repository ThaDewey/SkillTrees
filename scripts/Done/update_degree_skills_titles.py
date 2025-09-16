#!/usr/bin/env python3
"""
update_degree_skills_titles.py

Reads `DegreeJSON/degree_skills_test.json` and `UCOInfo/CourseDescriptions.json`, and updates
each course's `title` to prefer `title_short_desc` from the source data or a derived short
title (first sentence, up to 6 words). Writes the result to
`DegreeJSON/degree_skills_test_titled.json`.
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
SKILLS_PATH = os.path.join(ROOT, 'DegreeJSON', 'degree_skills_test.json')
SRC_PATH = os.path.join(ROOT, 'UCOInfo', 'CourseDescriptions.json')
OUT_PATH = os.path.join(ROOT, 'DegreeJSON', 'degree_skills_test_titled.json')


def load_json(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)


def short_from_text(text, max_words=6):
    if not text:
        return None
    s = text.strip()
    # take first sentence if possible
    first = s.split('.')
    if first and first[0].strip():
        words = first[0].strip().split()
        return ' '.join(words[:max_words]).strip()
    # fallback to first max_words words
    return ' '.join(s.split()[:max_words]).strip()


def main():
    skills = load_json(SKILLS_PATH)
    src = load_json(SRC_PATH)

    # Build lookup by subj+num and by course_identification
    by_code = {}
    for c in src:
        subj = c.get('subject') or c.get('subj')
        num = c.get('course_number') or c.get('course_number') or c.get('course_number')
        key = None
        if subj and num:
            key = f"{subj}-{num}"
        cid = c.get('course_identification')
        by_code[key] = c
        if cid:
            by_code[cid] = c

    for item in skills.get('courses', []):
        # try to find source entry
        cid = item.get('course_id')
        # course_id in extractor is like SUBJ-NUM
        src_entry = by_code.get(cid)
        if not src_entry:
            # try subj-num without dash
            subj = item.get('subj')
            num = item.get('num')
            if subj and num:
                src_entry = by_code.get(f"{subj}-{num}") or by_code.get(f"{subj}{num}")

        new_title = None
        if src_entry:
            new_title = src_entry.get('title_short_desc') or src_entry.get('course_title') or src_entry.get('Title')
            if not new_title:
                # fall back to derived short title from narrative
                narrative = src_entry.get('course_text_narrative') or src_entry.get('course_description') or src_entry.get('description')
                new_title = short_from_text(narrative)

        if new_title:
            item['title'] = new_title

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(skills, f, indent=2, ensure_ascii=False)
    print(f'Wrote updated titles to {OUT_PATH}')


if __name__ == '__main__':
    main()
