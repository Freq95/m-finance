#!/usr/bin/env python3
"""
Convert a cheltuieli CSV to m-finance-dash backup JSON.

Usage:
  python scripts/csv-to-finance-import.py
  python scripts/csv-to-finance-import.py data/buget2025-strategie26.csv
  python scripts/csv-to-finance-import.py data/buget2025-strategie26.csv data/finance-import.json

Output JSON can be imported in the app: Settings -> Import from file.
"""

import argparse
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

# App schema version (must match lib/storage/storage.ts CURRENT_VERSION)
SCHEMA_VERSION = 2

# All CategoryAmounts keys (must match lib/types.ts)
CATEGORY_KEYS = [
    "venit", "bonuri", "extra",
    "rate",
    "apple", "intretinere", "internet", "gaz", "curent", "telefon", "netflix", "sala",
    "educatie", "sanatate", "beauty", "haine",
    "diverse", "transport", "cadouri", "vacante", "casa", "gadgets", "tazz", "alimente",
    "economii", "investitii",
]

# Map CSV column headers (case-insensitive, stripped) -> app key.
# Add your CSV header names here. Romanian labels from the app are included.
COLUMN_TO_KEY = {
    # Income
    "venit": "venit",
    "bonuri": "bonuri",
    "extra": "extra",
    # Rate
    "rate": "rate",
    # Bills
    "apple": "apple",
    "intretinere": "intretinere",
    "întreținere": "intretinere",
    "internet": "internet",
    "gaz": "gaz",
    "curent": "curent",
    "telefon": "telefon",
    "netflix": "netflix",
    "sala": "sala",
    "sală": "sala",
    # Other
    "educatie": "educatie",
    "educație": "educatie",
    "sanatate": "sanatate",
    "sănătate": "sanatate",
    "beauty": "beauty",
    "haine": "haine",
    # Spending (Cheltuieli)
    "diverse": "diverse",
    "transport": "transport",
    "cadouri": "cadouri",
    "vacante": "vacante",
    "vacanțe": "vacante",
    "casa": "casa",
    "casă": "casa",
    "gadgets": "gadgets",
    "tazz": "tazz",
    "alimente": "alimente",
    # Savings
    "economii": "economii",
    "investitii": "investitii",
    "investiții": "investitii",
}

# Possible headers for the month column (first match wins)
MONTH_COLUMN_NAMES = ("luna", "month", "lună", "perioada", "data", "date")

# Strategy-format CSV: first column = label, second = amount; "incepand cu Ianuarie 2026" starts a period.
# Map first-column labels (normalized: lowercase, no extra spaces) -> app key.
LINE_ITEM_TO_KEY = {
    "credit imobiliar": "rate",
    "credit nevoi": "rate",
    "thermomix": "casa",
    "facturi": "intretinere",
    "trai": "alimente",
    "anticipat - nevoi": "rate",
    "anticipat - imobiliar": "rate",
    "actiuni": "investitii",
    "economii": "economii",
}
# Skip these first-column values (totals / section headers)
LINE_ITEM_SKIP = ("in *", "out", "diff", "incepand cu", "💋 kiss", "keep it stupid simple")

# Romanian month names -> 01..12 (short and long)
RO_MONTHS = {
    "ian": "01", "ianuarie": "01",
    "feb": "02", "februarie": "02",
    "mar": "03", "martie": "03",
    "apr": "04", "aprilie": "04",
    "mai": "05",
    "iun": "06", "iunie": "06",
    "iul": "07", "iulie": "07",
    "aug": "08", "august": "08",
    "sep": "09", "septembrie": "09",
    "oct": "10", "octombrie": "10",
    "nov": "11", "noiembrie": "11",
    "dec": "12", "decembrie": "12",
}


def normalize_header(h: str) -> str:
    return h.strip().lower() if h else ""


def parse_incepand_month(value: str) -> str | None:
    """Parse 'incepand cu Ianuarie 2026' or 'incepand cu 2030' -> YYYY-MM."""
    if not value or not isinstance(value, str):
        return None
    s = value.strip().lower()
    if not s.startswith("incepand"):
        return None
    # "incepand cu Ianuarie 2026" or "incepand cu Iunie 2026" or "incepand cu 2030"
    rest = s.replace("incepand cu", "").strip()
    parts = rest.split()
    if not parts:
        return None
    year = None
    month_num = "01"
    for p in parts:
        if p.isdigit() and len(p) == 4:
            year = p
            break
    if not year:
        return None
    for name, num in RO_MONTHS.items():
        if name in rest:
            month_num = num
            break
    return f"{year}-{month_num}"


def parse_month(value: str) -> str | None:
    """Parse a month value to YYYY-MM. Returns None if invalid."""
    if not value or not isinstance(value, str):
        return None
    s = value.strip()
    if not s:
        return None

    # Already YYYY-MM
    m = re.match(r"^(\d{4})-(\d{1,2})$", s)
    if m:
        y, mo = m.group(1), m.group(2).zfill(2)
        if 1 <= int(mo) <= 12:
            return f"{y}-{mo}"

    # DD.MM.YYYY or D.M.YYYY
    m = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", s.replace(" ", ""))
    if m:
        d, mo, y = m.group(1), m.group(2).zfill(2), m.group(3)
        if 1 <= int(mo) <= 12:
            return f"{y}-{mo}"

    # MM.YYYY or M.YYYY
    m = re.match(r"^(\d{1,2})\.(\d{4})$", s.replace(" ", ""))
    if m:
        mo, y = m.group(1).zfill(2), m.group(2)
        if 1 <= int(mo) <= 12:
            return f"{y}-{mo}"

    # "Ian 2025", "Ianuarie 2025", "2025 Ian"
    parts = s.split()
    if len(parts) >= 2:
        for i, p in enumerate(parts):
            if p.isdigit() and len(p) == 4:
                year = p
                rest = " ".join(parts[:i] + parts[i + 1 :]).lower()
                for name, num in RO_MONTHS.items():
                    if name in rest or rest.startswith(name):
                        return f"{year}-{num}"
                break

    return None


def parse_number(value: str) -> float:
    """
    Parse a number. Handles European format: dot = thousands (2.500 -> 2500), comma = decimal (1,5 -> 1.5).
    Also accepts dot as decimal (2.5 -> 2.5).
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        return 0.0
    s = str(value).strip().replace(" ", "")
    # Strip trailing "**" or similar
    if s:
        s = re.sub(r"\*+.*$", "", s).strip() or s
    if not s:
        return 0.0
    # European: 2.500 = 2500 (thousands), 1,5 = 1.5 (decimal). If comma present, treat as decimal separator.
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    else:
        # No comma: if single dot and 3 digits after, treat as thousands (2.500 -> 2500)
        if "." in s:
            before, _, after = s.partition(".")
            if after.isdigit() and len(after) == 3 and (not before or before.isdigit()):
                s = before + after  # integer
            # else keep as float (e.g. 2.5)
    try:
        return float(s)
    except ValueError:
        return 0.0


def default_category_amounts() -> dict[str, float]:
    return {k: 0.0 for k in CATEGORY_KEYS}


def row_to_category_amounts(row: dict[str, str], header_to_key: dict[str, str]) -> dict[str, float]:
    out = default_category_amounts()
    for csv_header, cell_value in row.items():
        norm = normalize_header(csv_header)
        app_key = header_to_key.get(norm)
        if app_key and app_key in out:
            out[app_key] = parse_number(cell_value)
    return out


def build_header_to_key(fieldnames: list[str]) -> tuple[str | None, dict[str, str]]:
    """
    From CSV field names, build: (month_column_normalized, header -> app_key).
    month_column_normalized is the normalized header used for month, or None.
    """
    month_col = None
    header_to_key = {}
    for f in fieldnames:
        n = normalize_header(f)
        if not n:
            continue
        if month_col is None and n in MONTH_COLUMN_NAMES:
            month_col = n
            continue
        if n in COLUMN_TO_KEY:
            header_to_key[n] = COLUMN_TO_KEY[n]
        else:
            # Try without diacritics for key lookup (e.g. "Intretinere" -> intretinere)
            key = n
            for csv_candidate, app_key in COLUMN_TO_KEY.items():
                if normalize_for_compare(csv_candidate) == normalize_for_compare(n):
                    header_to_key[n] = app_key
                    break
    return month_col, header_to_key


def normalize_for_compare(s: str) -> str:
    """Remove common diacritics for fuzzy header match."""
    replacements = {"ă": "a", "â": "a", "î": "i", "ș": "s", "ț": "t", "ş": "s", "ţ": "t"}
    t = s.lower()
    for a, b in replacements.items():
        t = t.replace(a, b)
    return t


def normalize_line_label(s: str) -> str:
    """Normalize first-column label for LINE_ITEM_TO_KEY lookup."""
    t = " ".join(s.strip().lower().split())
    for skip in LINE_ITEM_SKIP:
        if skip in t or t.startswith("incepand"):
            return ""
    return t


def _line_item_to_app_key(label: str) -> str | None:
    app_key = LINE_ITEM_TO_KEY.get(label)
    if app_key:
        return app_key
    for csv_label, key in LINE_ITEM_TO_KEY.items():
        if normalize_for_compare(csv_label) == normalize_for_compare(label):
            return key
    return None


# Strategy CSV: (label_col, amount_col) pairs - top block uses (1,2), period blocks also use (3,4)
STRATEGY_LABEL_AMOUNT_PAIRS = [(1, 2), (3, 4)]


def parse_strategy_csv(rows: list[list[str]]) -> list[tuple[str, dict[str, float]]]:
    """
    Parse strategy-format CSV: STRATEGY_LABEL_COL = label, STRATEGY_AMOUNT_COL = amount.
    Rows before first 'incepand cu ...' = base (recurring) amounts.
    Each 'incepand cu ...' starts a period; following line items add/overwrite until next 'incepand cu'.
    Returns list of (month_str, category_amounts).
    """
    base_amounts = default_category_amounts()
    result: list[tuple[str, dict[str, float]]] = []
    current_month: str | None = None
    current_amounts = default_category_amounts()
    seen_incepand = False

    for row in rows:
        if not row:
            continue
        col0_for_incepand = (row[0] or "").strip().replace("\n", " ").lower()
        label_cell_1 = (row[1] if len(row) > 1 else "") or ""
        label_lower = label_cell_1.strip().replace("\n", " ").lower()

        # New period (can be in col0 or in label column 1)
        if "incepand cu" in col0_for_incepand or "incepand cu" in label_lower:
            seen_incepand = True
            if current_month:
                result.append((current_month, {k: v for k, v in current_amounts.items()}))
            month = parse_incepand_month((row[0] or "") + " " + label_cell_1)
            current_month = month
            # Start with copy of base for this period
            current_amounts = {k: v for k, v in base_amounts.items()}
            continue

        # Try each (label_col, amount_col) pair
        for label_col, amount_col in STRATEGY_LABEL_AMOUNT_PAIRS:
            if len(row) <= max(label_col, amount_col):
                continue
            label_cell = (row[label_col] or "").strip().replace("\n", " ")
            amount_cell = (row[amount_col] or "").strip()
            label = normalize_line_label(label_cell)
            if not label:
                continue
            amount = parse_number(amount_cell)
            if amount == 0:
                continue
            app_key = _line_item_to_app_key(label)
            if not app_key or app_key not in current_amounts:
                continue
            # Add so multiple line items mapping to same key sum
            current_amounts[app_key] = current_amounts.get(app_key, 0) + amount
            if not seen_incepand:
                base_amounts[app_key] = base_amounts.get(app_key, 0) + amount
            elif current_month is None:
                current_month = datetime.now(timezone.utc).strftime("%Y-%m")

    if current_month:
        result.append((current_month, {k: v for k, v in current_amounts.items()}))

    return result


def is_strategy_format(rows: list[list[str]]) -> bool:
    """Heuristic: first cell contains 'cheltuieli' or any row has 'incepand cu' in col0."""
    if not rows:
        return False
    first_cell = (rows[0][0] or "").lower().replace("\n", " ")
    if "cheltuieli" in first_cell:
        return True
    for row in rows:
        if row and "incepand cu" in (row[0] or "").lower():
            return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert cheltuieli CSV to m-finance-dash backup JSON."
    )
    root = Path(__file__).resolve().parent.parent
    parser.add_argument(
        "input",
        nargs="?",
        default=root / "data" / "buget2025-strategie26.csv",
        help="Input CSV path (default: data/buget2025-strategie26.csv)",
    )
    parser.add_argument(
        "output",
        nargs="?",
        default=root / "data" / "finance-import.json",
        help="Output JSON path (default: data/finance-import.json)",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        print("Usage: python scripts/csv-to-finance-import.py [input.csv] [output.json]")
        raise SystemExit(1)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # Read raw rows to detect format
    with open(input_path, newline="", encoding="utf-8-sig") as f:
        raw_rows = list(csv.reader(f))

    records: list[dict] = []

    if raw_rows and is_strategy_format(raw_rows):
        # Strategy format: first column = label, second = amount; "incepand cu ..." starts period
        parsed = parse_strategy_csv(raw_rows)
        for month_str, amounts in parsed:
            records.append({
                "month": month_str,
                "people": {
                    "me": amounts,
                    "wife": {k: v for k, v in amounts.items()},
                },
                "meta": {"updatedAt": now_iso, "isSaved": False},
            })
        records.sort(key=lambda r: r["month"])
    else:
        # Table format: first row = headers, one row per month
        if not raw_rows:
            print("Error: CSV is empty.")
            raise SystemExit(1)
        fieldnames = raw_rows[0]
        rows_as_dicts = [dict(zip(fieldnames, row)) for row in raw_rows[1:] if len(row) >= len(fieldnames)]
        if not fieldnames:
            print("Error: CSV has no header row.")
            raise SystemExit(1)

        month_col_norm, header_to_key = build_header_to_key(fieldnames)
        month_col_raw = None
        for h in fieldnames:
            if normalize_header(h) == month_col_norm:
                month_col_raw = h
                break

        skipped = 0
        for row in rows_as_dicts:
            month_value = row.get(month_col_raw or "", "").strip() if month_col_raw else ""
            month = parse_month(month_value)
            if not month:
                month = datetime.now(timezone.utc).strftime("%Y-%m")
                if month_value:
                    skipped += 1
            amounts = row_to_category_amounts(row, header_to_key)
            records.append({
                "month": month,
                "people": {"me": amounts, "wife": {k: v for k, v in amounts.items()}},
                "meta": {"updatedAt": now_iso, "isSaved": False},
            })
        records.sort(key=lambda r: r["month"])
        if skipped:
            print(f"Skipped {skipped} row(s) with invalid month (used fallback).")

    schema = {"version": SCHEMA_VERSION, "data": records}

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(records)} month(s) to {output_path}")


if __name__ == "__main__":
    main()
