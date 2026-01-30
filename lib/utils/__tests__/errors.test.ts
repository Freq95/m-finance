import {
  getErrorMessage,
  StorageError,
  ValidationError,
} from "../errors";

describe("getErrorMessage", () => {
  it("returns message for Error instance", () => {
    expect(getErrorMessage(new Error("Something failed"))).toBe("Something failed");
  });

  it("returns string when error is string", () => {
    expect(getErrorMessage("String error")).toBe("String error");
  });

  it("returns default for other types", () => {
    expect(getErrorMessage(42)).toBe("An unknown error occurred");
    expect(getErrorMessage(null)).toBe("An unknown error occurred");
    expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
  });
});

describe("StorageError", () => {
  it("has name StorageError", () => {
    const err = new StorageError("test");
    expect(err.name).toBe("StorageError");
  });

  it("has message", () => {
    const err = new StorageError("Storage failed");
    expect(err.message).toBe("Storage failed");
  });
});

describe("ValidationError", () => {
  it("has name ValidationError", () => {
    const err = new ValidationError("test");
    expect(err.name).toBe("ValidationError");
  });

  it("has message", () => {
    const err = new ValidationError("Invalid payload");
    expect(err.message).toBe("Invalid payload");
  });
});
