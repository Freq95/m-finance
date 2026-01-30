#!/usr/bin/env python3
"""
Convert budget CSV/TSV (persoana, luna, category columns) to m-finance-dash backup JSON.

Supports:
- only-1.csv: comma-delimited, single header row (persoana,luna,venit,...,investitii),
  columns 2..27 map directly to categories. Empty rows skipped.
- buget-lunar.tsv: tab-delimited, two header rows; uses COL_INDEX_TO_KEY for alignment.
"""

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 2

# Category keys - must match lib/types.ts CategoryAmounts (order = CSV columns 2..27)
CATEGORY_KEYS = [
    "venit", "bonuri", "extra", "rate",
    "apple", "intretinere", "internet", "gaz", "curent", "telefon", "netflix", "sala",
    "educatie", "sanatate", "beauty", "haine",
    "diverse", "transport", "cadouri", "vacante", "casa", "gadgets", "tazz", "alimente",
    "economii", "investitii",
]

# TSV (buget-lunar.tsv) column index -> category key when not using direct CSV mapping
COL_INDEX_TO_KEY: list[tuple[int, str]] = [
    (2, "venit"), (3, "bonuri"), (4, "extra"), (5, "rate"),
    (6, "apple"), (7, "intretinere"), (8, "internet"), (9, "gaz"), (10, "curent"),
    (11, "telefon"), (12, "netflix"), (14, "sala"),
    (15, "educatie"), (16, "sanatate"), (17, "beauty"), (18, "haine"),
    (19, "diverse"), (20, "transport"), (21, "alimente"), (22, "economii"), (23, "investitii"),
]

RO_MONTHS = {
    "ianuarie": "01", "februarie": "02", "martie": "03", "aprilie": "04", "mai": "05",
    "iunie": "06", "iulie": "07", "august": "08", "septembrie": "09",
    "octombrie": "10", "noiembrie": "11", "decembrie": "12",
}


def parse_month(luna: str, default_year: int = 2025) -> str | None:
    if not luna or not luna.strip():
        return None
    s = luna.strip().lower()
    if s in RO_MONTHS:
        return f"{default_year}-{RO_MONTHS[s]}"
    return None


def parse_val(x: str) -> float:
    if not x or not str(x).strip():
        return 0.0
    s = str(x).strip().replace(" ", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def _is_simple_csv_header(row: list[str]) -> bool:
    """First row is persoana,luna,venit,...,investitii with 28+ columns."""
    if len(row) < 28:
        return False
    a, b = (row[0] or "").strip().lower(), (row[1] or "").strip().lower()
    return a == "persoana" and b == "luna"


def _row_to_amounts_direct(row: list[str]) -> dict[str, float]:
    """Columns 2..27 map to CATEGORY_KEYS in order (only-1.csv format)."""
    amounts = {k: 0.0 for k in CATEGORY_KEYS}
    for i, key in enumerate(CATEGORY_KEYS):
        idx = 2 + i
        if idx < len(row):
            amounts[key] = parse_val(row[idx])
    return amounts


def _row_to_amounts_tsv(row: list[str]) -> dict[str, float]:
    """Use COL_INDEX_TO_KEY for buget-lunar.tsv alignment."""
    amounts = {k: 0.0 for k in CATEGORY_KEYS}
    for col_idx, key in COL_INDEX_TO_KEY:
        if col_idx < len(row):
            amounts[key] = parse_val(row[col_idx])
    return amounts


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description="Convert budget CSV/TSV to finance-import.json")
    parser.add_argument("input", nargs="?", default=str(root / "data" / "only-1.csv"), help="Input CSV or TSV path")
    parser.add_argument("-o", "--output", default=str(root / "data" / "finance-import.json"), help="Output JSON path")
    args = parser.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.output)
    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    delimiter = "," if input_path.suffix.lower() == ".csv" else "\t"
    rows = list(csv.reader(input_path.open(encoding="utf-8-sig"), delimiter=delimiter))
    if not rows:
        raise SystemExit("File is empty")

    # Detect format: simple CSV (one header, columns 2..27 = categories) vs TSV (two header rows)
    use_direct = delimiter == "," and _is_simple_csv_header(rows[0])
    if use_direct:
        data_rows = rows[1:]  # skip single header
        row_to_amounts = _row_to_amounts_direct
    else:
        data_rows = rows[2:] if len(rows) >= 3 else []  # skip two header rows
        row_to_amounts = _row_to_amounts_tsv

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    records_by_month: dict[str, dict] = {}
    current_month_str: str | None = None
    default_year = 2025

    for row in data_rows:
        if not row:
            continue
        persoana = (row[0] or "").strip()
        luna = (row[1] or "").strip() if len(row) > 1 else ""
        # Skip empty rows (e.g. only-1.csv row 2)
        if not persoana and not luna and len(row) <= 2:
            continue
        if persoana not in ("Paul", "Codru"):
            continue
        if luna:
            month = parse_month(luna, default_year)
            if month:
                current_month_str = month
        if not current_month_str:
            continue

        amounts = row_to_amounts(row)

        if current_month_str not in records_by_month:
            records_by_month[current_month_str] = {
                "month": current_month_str,
                "people": {
                    "me": {k: 0.0 for k in CATEGORY_KEYS},
                    "wife": {k: 0.0 for k in CATEGORY_KEYS},
                },
                "meta": {"updatedAt": now_iso, "isSaved": False},
            }
        rec = records_by_month[current_month_str]
        if persoana == "Paul":
            rec["people"]["me"] = amounts
        else:
            rec["people"]["wife"] = amounts

    records = sorted(records_by_month.values(), key=lambda r: r["month"])
    schema = {"version": SCHEMA_VERSION, "data": records}
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} month(s) to {out_path}")


if __name__ == "__main__":
    main()
