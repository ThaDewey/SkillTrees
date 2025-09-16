CSV -> JSON converter

Usage

PowerShell example:

```powershell
py .\scripts\csv_to_json.py --input "DegreeJSON/CourseDescriptions(Export).csv" --output "DegreeJSON/CourseDescriptions.json"
```

Options
- `--input` / `-i`: input CSV path (required)
- `--output` / `-o`: output JSON path (required)
- `--delimiter` / `-d`: CSV delimiter (default `,`)
- `--encoding`: file encoding (default `utf-8`)
- `--indent`: JSON indent (default `2`)

Notes
- The converter normalizes header names to snake_case (lowercase, spaces and slashes replaced with underscores).
- It will coerce purely numeric fields to `int` and float-like fields to `float` where reasonable.
- Tested with Python 3.8+. Recommended 3.10+.
