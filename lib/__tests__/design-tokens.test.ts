import { barCornerRadius, colors, shadows, spacing, transitions, typography } from "../design-tokens";

describe("design-tokens", () => {
  it("exports stable token objects", () => {
    expect(colors.background).toBeTruthy();
    expect(Array.isArray(colors.chartPalette)).toBe(true);
    expect(barCornerRadius).toBeGreaterThan(0);
    expect(typography.h1.fontSize).toBeTruthy();
    expect(spacing.cardPadding).toBeTruthy();
    expect(shadows.card).toContain("rgba");
    expect(transitions.default).toContain("ms");
  });
});

