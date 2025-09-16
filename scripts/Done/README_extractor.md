# extract_skills.py — Usage and notes

This script extracts skill phrases from `DegreeJSON/CourseDescriptions.json` using an LLM (designed to work with Ollama) and writes a normalized `degree_skills.json` for downstream database consumption.

Files created
- `scripts/extract_skills.py` — main extractor script
- `scripts/test_extract_skills.py` — small smoke-test that runs the extractor in mock mode and writes `scripts/test_degree_skills.json`

Configuration
- `OLLAMA_HTTP_URL`: (optional) base URL for the Ollama HTTP API, e.g. `http://localhost:11434`.
- `OLLAMA_MODEL`: (optional) model name to request from Ollama. Default in the script is `llama2`.
- `MOCK_MODE`: if set to `1` the script will run in mock mode and not call any LLM.

Behavior
- By default the script will run in mock mode if `OLLAMA_HTTP_URL` is not provided or when `--mock` is passed.
- The script normalizes course entries and produces an array of course objects with `course_id`, `subj`, `num`, `title`, and `skills`.

Output
- Default output path: `DegreeJSON/degree_skills.json` (relative to repository root)

PowerShell examples (Windows)

Run the extractor in mock mode (fast, offline):
```
python .\scripts\extract_skills.py --mock
```

Run the extractor against a local Ollama HTTP server:
```
$env:OLLAMA_HTTP_URL = 'http://localhost:11434'; python .\scripts\extract_skills.py
```

Run with explicit model and output path:
```
python .\scripts\extract_skills.py --ollama-url http://localhost:11434 --model llama2 --output DegreeJSON\degree_skills.json
```

If you don't have Python installed
- Install Python 3.8+ from https://www.python.org/downloads/windows/ or via the Microsoft Store. Make sure `python` is on your PATH.

Notes about Ollama
- The script is written to call an HTTP endpoint `POST /api/generate` with a JSON body. Adjust `call_ollama_http` if your Ollama HTTP API uses a different endpoint or parameter names.
- If you use the Ollama CLI or another LLM gateway, you can adapt the script to call it or substitute the `mock_extract_skills` logic.

Next steps for you
1. Install Python if you want to run the smoke tests locally.
2. Start Ollama locally (or provide a valid `OLLAMA_HTTP_URL`) to enable real LLM extraction.
3. Run `python .\scripts\extract_skills.py` and inspect `DegreeJSON/degree_skills.json`.
