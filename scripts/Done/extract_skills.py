import json
from pathlib import Path
import pprint
import sys

def main():
    json_path = Path(r"d:\Projects\Web\SkillTrees\UCOInfo\full Course Desription.json")
    if not json_path.exists():
        print(f"File not found: {json_path}")
        sys.exit(1)

    with json_path.open(encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list) or len(data) == 0:
        print("JSON does not contain a non-empty list.")
        sys.exit(1)

    first_item = data[0]
    pprint.pprint(first_item)

if __name__ == "__main__":
    main()