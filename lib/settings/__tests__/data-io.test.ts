/** @jest-environment jsdom */
import { exportBackup, importBackup } from "../data-io";
import { createDefaultCategoryAmounts } from "../../validation/schemas";

const exportData = jest.fn();
const saveRecords = jest.fn();
const validateSchema = jest.fn();

jest.mock("@/lib/storage/storage", () => ({
  CURRENT_VERSION: 3,
  exportData: () => exportData(),
  saveRecords: (records: unknown) => saveRecords(records),
}));

jest.mock("@/lib/storage/migrations", () => ({
  validateSchema: (payload: unknown) => validateSchema(payload),
}));

describe("settings data-io", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 9, 0, 0));
    exportData.mockReset();
    saveRecords.mockReset();
    validateSchema.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("exports full backup with profiles and filename", async () => {
    const profiles = [{ id: "me", name: "Me" }];
    exportData.mockResolvedValue({ version: 3, data: [] });

    let capturedBlob: Blob | null = null;
    const createObjectUrlSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return "blob:mock";
      });
    const revokeSpy = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    const originalCreateElement = document.createElement.bind(document);
    const clickSpy = jest.fn();
    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === "a") {
        (el as HTMLAnchorElement).click = clickSpy as unknown as () => void;
      }
      return el;
    });

    await exportBackup("full", profiles);

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock");

    const payload = JSON.parse(await capturedBlob!.text()) as {
      version: number;
      data: unknown[];
      profiles?: unknown[];
    };
    expect(payload.version).toBe(3);
    expect(payload.data).toEqual([]);
    expect(payload.profiles).toEqual(profiles);
  });

  it("exports data-only backup with data suffix", async () => {
    exportData.mockResolvedValue({ version: 3, data: [] });

    const originalCreateElement = document.createElement.bind(document);
    let anchor: HTMLAnchorElement | null = null;
    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === "a") anchor = el as HTMLAnchorElement;
      return el;
    });
    jest.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:mock");
    jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await exportBackup("data_only");

    expect(anchor?.download).toBe("finance-dashboard-backup-data-2026-01-02.json");
  });

  it("imports backup and returns profiles when present", async () => {
    const record = {
      month: "2026-01",
      people: { me: createDefaultCategoryAmounts() },
      meta: {
        updatedAt: "2026-01-02T00:00:00.000Z",
        isSaved: true,
      },
    };
    const inputPayload = {
      version: 3,
      data: [record],
      profiles: [{ id: "me", name: "Me" }],
    };
    validateSchema.mockReturnValue({ version: 3, data: [record] });

    const file = new File([JSON.stringify(inputPayload)], "backup.json", {
      type: "application/json",
    });
    const result = await importBackup(file);

    expect(saveRecords).toHaveBeenCalledWith([record]);
    expect(result.profiles).toEqual([{ id: "me", name: "Me" }]);
  });

  it("imports backup and omits profiles when missing", async () => {
    const record = {
      month: "2026-01",
      people: { me: createDefaultCategoryAmounts() },
      meta: {
        updatedAt: "2026-01-02T00:00:00.000Z",
        isSaved: true,
      },
    };
    const inputPayload = {
      version: 3,
      data: [record],
    };
    validateSchema.mockReturnValue({ version: 3, data: [record] });

    const file = new File([JSON.stringify(inputPayload)], "backup.json", {
      type: "application/json",
    });
    const result = await importBackup(file);

    expect(saveRecords).toHaveBeenCalledWith([record]);
    expect(result.profiles).toBeUndefined();
  });
});
