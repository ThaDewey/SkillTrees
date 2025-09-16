import json
import tempfile
from pathlib import Path

from csv_to_json import convert_csv_to_json


def test_convert_simple_csv(tmp_path: Path):
    csv_text = """a,b,c
1,2,hello
3,4,world
"""

    in_file = tmp_path / "sample.csv"
    out_file = tmp_path / "sample.json"
    in_file.write_text(csv_text, encoding="utf-8")

    rows = convert_csv_to_json(in_file, out_file)
    assert len(rows) == 2
    assert rows[0]["a"] == 1
    assert rows[0]["b"] == 2
    assert rows[0]["c"] == "hello"

    # ensure file written
    assert out_file.exists()
    data = json.loads(out_file.read_text(encoding="utf-8"))
    assert data == rows


if __name__ == "__main__":
    # simple local run
    import sys

    tmp = Path(tempfile.gettempdir()) / "csv_to_json_test"
    tmp.mkdir(exist_ok=True)
    test_convert_simple_csv(tmp)
    print("test passed")
