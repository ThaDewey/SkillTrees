import json
import subprocess
from pathlib import Path
import sys
import shutil
import os
import re

# Config
MODEL = "mistral"  # change if you use a different local model name
OUT_FILE = Path(r"d:\Projects\Web\SkillTrees\output\ollama_course_skills.json")
SRC_FILE = Path(r"d:\Projects\Web\SkillTrees\UCOInfo\full Course Desription.json")
NUM_SKILLS = 8

PROMPT_TEMPLATE = (
    "You are an assistant that extracts concrete learning SKILLS from a course title and course description. "
    "Given the course title and description, list up to {n} distinct, actionable skills a student will learn. "
    "Requirements (must follow): "
    "1) DO NOT include prerequisites, enrollment rules, course codes, credits, repeatability, or scheduling info. "
    "2) DO NOT produce labels that include digits or course codes (e.g. 'ENG 1113', 'CSDY2513'). "
    "3) Each skill must be an object with 'label' (3 words max, a short verb/noun phrase) and 'description' (one concise sentence describing the competency). "
    "4) Prefer measurable/observable competencies (examples: 'Analyze narrative structure', 'Compose persuasive essays', 'Apply genre conventions'). "
    "5) Avoid vague administrative labels such as 'Prerequisite Knowledge', 'Enrollment Restriction', or 'Course Repeatability'. "
    "Output EXACTLY valid JSON for a single course in this shape: "
    "{\"course_identification\": \"<ID>\", \"title_short_desc\": \"<TITLE>\", \"inferred_skills\": [{\"label\":\"...\",\"description\":\"...\"}, ...] }"
)

OLLAMA_EXE = os.environ.get("OLLAMA_EXE") or shutil.which("ollama")
if not OLLAMA_EXE:
    # try common Windows install locations
    candidates = [
        str(Path.home() / r"AppData\Local\Programs\ollama\ollama.exe"),
        r"C:\Program Files\ollama\ollama.exe",
        r"C:\Program Files (x86)\ollama\ollama.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            OLLAMA_EXE = c
            break


def build_prompt(course, n=NUM_SKILLS):
    title = course.get("title_short_desc", "")
    narrative = course.get("course_text_narrative", "")
    cid = course.get("course_identification") or f"{course.get('subject','')}{course.get('course_number','')}"
    # PROMPT_TEMPLATE contains literal JSON braces, so avoid using str.format which
    # would interpret those braces. Use replace to only substitute the {n} token.
    instruction = PROMPT_TEMPLATE.replace("{n}", str(n))
    prompt = {
        "course_identification": cid,
        "title_short_desc": title,
        "course_text_narrative": narrative,
        "instruction": instruction,
    }
    # We'll provide the prompt as a simple JSON string to the model for easier parsing
    return json.dumps(prompt, ensure_ascii=False)


def call_ollama(prompt_text, model=MODEL):
    """
    Call the ollama CLI with a prompt string. Try several invocations:
      1) positional prompt argument: `ollama run <model> <prompt>`
      2) pass prompt on STDIN: `ollama run <model>` with input=prompt_text
      3) fallback to long `--prompt` if supported
    This avoids errors on Ollama versions that don't support --prompt or -p.
    """
    exe = OLLAMA_EXE or "ollama"
    print(f"Using ollama executable: {exe}")

    # Try positional prompt first (most compatible)
    try:
        cmd = [exe, "run", model, prompt_text]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError as e_pos:
        print("Positional prompt failed:", e_pos)

    # Try sending prompt via stdin
    try:
        cmd = [exe, "run", model]
        res = subprocess.run(cmd, input=prompt_text, capture_output=True, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError as e_stdin:
        print("STDIN prompt failed:", e_stdin)

    # Final fallback: long --prompt (may not be supported on some versions)
    try:
        cmd = [exe, "run", model, "--prompt", prompt_text]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError as e_long:
        print("Long-flag --prompt failed:", e_long)
        # re-raise the last error so caller knows this run failed
        raise


def filter_skills_list(skills):
    """Remove skills that look like prerequisites, course codes, or contain digits."""
    out = []
    for s in skills:
        label = (s.get("label") or "").strip()
        desc = (s.get("description") or "").strip()
        # reject if label or description contains course codes, three-digit numbers, or words like prereq/prerequisite
        if re.search(r'\b(prereq|prerequisite|prereqs|prerequisite)\b', label, re.I): 
            continue
        if re.search(r'\bENG\b|\bCSDY\b|\b[A-Z]{2,5}\s*\d{3}\b|\d{3,}\b', label):
            continue
        if re.search(r'\b(prereq|prerequisite|credits?|enroll(ment)?|eligib|course code)\b', desc, re.I):
            continue
        out.append(s)
    return out


def main():
    if not SRC_FILE.exists():
        print(f"Source not found: {SRC_FILE}")
        return

    with SRC_FILE.open(encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        print("No courses in source file")
        return

    # Determine which course to process: index or id
    if len(sys.argv) < 2:
        idx = 0
    else:
        arg = sys.argv[1]
        # If numeric, treat as index
        if arg.isdigit():
            idx = int(arg)
        else:
            # find by course_identification
            idx = next((i for i,c in enumerate(data) if c.get("course_identification") == arg), None)
            if idx is None:
                print(f"Course id not found: {arg}")
                return

    if idx < 0 or idx >= len(data):
        print(f"Index out of range: {idx}")
        return

    course = data[idx]
    prompt_text = build_prompt(course, n=NUM_SKILLS)

    print("Sending prompt to Ollama for course:", course.get("course_identification"))
    print("Prompt (truncated):", prompt_text[:400], "...\n")

    # Prepare output directory and master file
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Load existing master list so we can skip already-processed courses
    master = []
    if OUT_FILE.exists():
        try:
            with OUT_FILE.open(encoding="utf-8") as f:
                master = json.load(f)
        except Exception:
            master = []

    cid = course.get("course_identification") or f"{course.get('subject','')}{course.get('course_number','')}"
    # If this course id already in master, skip to avoid duplicates
    if any(e.get("course_identification") == cid for e in master):
        print(f"Course {cid} already in master file, skipping")
        return

    # Call Ollama CLI
    response = call_ollama(prompt_text)

    # Try to parse JSON from the model output. Model may output extra text; we'll attempt to extract JSON.
    parsed = None
    try:
        parsed = json.loads(response)
    except Exception:
        # Attempt to find first JSON object in the response
        m = re.search(r"\{[\s\S]*\}\s*$", response)
        if m:
            try:
                parsed = json.loads(m.group(0))
            except Exception:
                parsed = None

    if parsed is None:
        # Save raw response for inspection and continue
        err_file = OUT_FILE.parent / "ollama_course_skills_errors.txt"
        with err_file.open("a", encoding="utf-8") as ef:
            ef.write(f"--- Index {idx} ({cid}) ---\n")
            ef.write(response + "\n\n")
        print(f"Failed to parse JSON from Ollama response for {cid}; raw output written to {err_file}")
        return

    parsed = json.loads(response)
    parsed["inferred_skills"] = filter_skills_list(parsed.get("inferred_skills", []))

    # Append parsed result to master and write file
    master.append(parsed)
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(master, f, indent=2, ensure_ascii=False)

    print(f"Appended result for {cid} to {OUT_FILE}")


if __name__ == "__main__":
    main()
