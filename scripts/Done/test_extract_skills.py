#!/usr/bin/env python3
"""
Simple smoke test for extract_skills.py. Runs the processing in mock mode on a tiny sample
and asserts the output format.
"""
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(__file__)
sys.path.insert(0, SCRIPT_DIR)

from extract_skills import process_courses, write_output


def run_test():
    sample = [
        {
            'course_subject': 'ACM',
            'course_number': '1213',
            'course_title': 'Intro to Computing',
            'course_text_narrative': 'Introduction to programming, problem solving, and computer systems.'
        },
        {
            'course_subject': 'MATH',
            'course_number': '2103',
            'course_title': 'Statistics I',
            'course_text_narrative': 'Probability, distributions, sampling, and inference.'
        }
    ]

    results = process_courses(sample, mock=True)
    assert isinstance(results, list)
    assert len(results) == 2
    for item in results:
        assert 'course_id' in item
        assert 'skills' in item
        assert isinstance(item['skills'], list)

    outpath = os.path.join(SCRIPT_DIR, 'test_degree_skills.json')
    write_output(results, outpath)
    print('Test output written to', outpath)


if __name__ == '__main__':
    run_test()
