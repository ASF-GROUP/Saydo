import { describe, it, expect } from "vitest";
import { hexToRgba } from "../../src/utils/color.js";

describe("hexToRgba", () => {
  it("converts 6-char hex with hash", () => {
    expect(hexToRgba("#ff0000", 1)).toBe("rgba(255,0,0,1)");
    expect(hexToRgba("#00ff00", 0.5)).toBe("rgba(0,255,0,0.5)");
    expect(hexToRgba("#0000ff", 0)).toBe("rgba(0,0,255,0)");
  });

  it("converts 3-char shorthand hex", () => {
    expect(hexToRgba("#fff", 1)).toBe("rgba(255,255,255,1)");
    expect(hexToRgba("#abc", 0.5)).toBe("rgba(170,187,204,0.5)");
    expect(hexToRgba("#000", 1)).toBe("rgba(0,0,0,1)");
  });

  it("handles bare hex without hash", () => {
    expect(hexToRgba("ff0000", 1)).toBe("rgba(255,0,0,1)");
    expect(hexToRgba("3b82f6", 0.2)).toBe("rgba(59,130,246,0.2)");
  });

  it("returns fallback gray for invalid input", () => {
    expect(hexToRgba("", 1)).toBe("rgba(128,128,128,1)");
    expect(hexToRgba("#zzzzzz", 0.5)).toBe("rgba(128,128,128,0.5)");
    expect(hexToRgba("#12", 1)).toBe("rgba(128,128,128,1)");
    expect(hexToRgba("#1234567", 1)).toBe("rgba(128,128,128,1)");
  });

  it("preserves alpha value in output", () => {
    expect(hexToRgba("#000000", 0)).toBe("rgba(0,0,0,0)");
    expect(hexToRgba("#000000", 0.33)).toBe("rgba(0,0,0,0.33)");
    expect(hexToRgba("#000000", 1)).toBe("rgba(0,0,0,1)");
  });
});
