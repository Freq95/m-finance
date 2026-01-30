import { findRecordIndex, upsertRecord } from "../record-helpers";
import type { MonthRecord } from "../../types";
import { createDefaultCategoryAmounts } from "../../validation/schemas";

function makeRecord(month: MonthRecord["month"]): MonthRecord {
  return {
    month,
    people: {
      me: createDefaultCategoryAmounts(),
      wife: createDefaultCategoryAmounts(),
    },
    meta: { updatedAt: new Date().toISOString(), isSaved: false },
  };
}

describe("findRecordIndex", () => {
  it("returns index when record exists", () => {
    const records = [
      makeRecord("2024-01"),
      makeRecord("2024-02"),
      makeRecord("2024-03"),
    ];
    expect(findRecordIndex(records, "2024-01")).toBe(0);
    expect(findRecordIndex(records, "2024-02")).toBe(1);
    expect(findRecordIndex(records, "2024-03")).toBe(2);
  });

  it("returns -1 when month not found", () => {
    const records = [makeRecord("2024-01")];
    expect(findRecordIndex(records, "2024-02")).toBe(-1);
    expect(findRecordIndex(records, "2023-12")).toBe(-1);
  });

  it("returns -1 for empty array", () => {
    expect(findRecordIndex([], "2024-01")).toBe(-1);
  });
});

describe("upsertRecord", () => {
  it("replaces existing record by month", () => {
    const a = makeRecord("2024-01");
    const b = makeRecord("2024-01");
    b.meta.isSaved = true;
    const records = [a];
    const next = upsertRecord(records, b);
    expect(next).toHaveLength(1);
    expect(next[0].meta.isSaved).toBe(true);
  });

  it("appends when month not present", () => {
    const records = [makeRecord("2024-01")];
    const newRec = makeRecord("2024-02");
    const next = upsertRecord(records, newRec);
    expect(next).toHaveLength(2);
    expect(next[0].month).toBe("2024-01");
    expect(next[1].month).toBe("2024-02");
  });

  it("does not mutate original array", () => {
    const records = [makeRecord("2024-01")];
    const newRec = makeRecord("2024-02");
    upsertRecord(records, newRec);
    expect(records).toHaveLength(1);
  });

  it("handles empty array", () => {
    const rec = makeRecord("2024-01");
    const next = upsertRecord([], rec);
    expect(next).toHaveLength(1);
    expect(next[0].month).toBe("2024-01");
  });
});
