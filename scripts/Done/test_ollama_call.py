import subprocess
import sys

def run(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return (0, r.stdout)
    except FileNotFoundError:
        return (2, f"Command not found: {cmd[0]}")
    except subprocess.CalledProcessError as e:
        return (e.returncode, e.stderr or e.stdout)

if __name__ == '__main__':
    code, out = run(["ollama", "--version"])
    if code == 0:
        print("ollama --version output:\n", out)
    else:
        print("ollama --version failed:\n", out)

    code, out = run(["ollama", "list"])
    if code == 0:
        print("\nollama list output:\n", out)
        print("\nResult: Python can reach the Ollama CLI (exit code 0).")
        sys.exit(0)
    elif code == 2:
        print("\nResult: Ollama not found in PATH from Python.")
        sys.exit(2)
    else:
        print("\nollama list failed with output:\n", out)
        sys.exit(code)
