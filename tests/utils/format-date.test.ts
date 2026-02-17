import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTaskDate, formatTaskTime } from "../../src/utils/format-date.js";

describe("formatTaskDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("relative format", () => {
    it("returns 'Today' for today's date", () => {
      expect(formatTaskDate("2026-02-16T10:00:00Z", "relative")).toBe("Today");
    });

    it("returns 'Yesterday' for yesterday", () => {
      expect(formatTaskDate("2026-02-15T10:00:00Z", "relative")).toBe("Yesterday");
    });

    it("returns 'Tomorrow' for tomorrow", () => {
      expect(formatTaskDate("2026-02-17T10:00:00Z", "relative")).toBe("Tomorrow");
    });

    it("returns weekday name for dates within next 6 days", () => {
      const result = formatTaskDate("2026-02-20T10:00:00Z", "relative");
      expect(result).toBe("Friday");
    });

    it("returns short date for older dates in same year", () => {
      const result = formatTaskDate("2026-01-05T10:00:00Z", "relative");
      expect(result).toBe("Jan 5");
    });

    it("includes year for dates in different year", () => {
      const result = formatTaskDate("2025-06-15T10:00:00Z", "relative");
      expect(result).toBe("Jun 15, 2025");
    });
  });

  describe("short format", () => {
    it("formats as abbreviated month, day, year", () => {
      const result = formatTaskDate("2026-01-15T10:00:00Z", "short");
      expect(result).toBe("Jan 15, 2026");
    });
  });

  describe("long format", () => {
    it("formats as full month name, day, year", () => {
      const result = formatTaskDate("2026-01-15T10:00:00Z", "long");
      expect(result).toBe("January 15, 2026");
    });
  });

  describe("iso format", () => {
    it("formats as YYYY-MM-DD", () => {
      expect(formatTaskDate("2026-01-15T10:00:00Z", "iso")).toBe("2026-01-15");
    });
  });

  it("returns raw string for invalid dates", () => {
    expect(formatTaskDate("not-a-date", "short")).toBe("not-a-date");
  });
});

describe("formatTaskTime", () => {
  it("formats time in 12-hour mode", () => {
    const result = formatTaskTime("2026-02-16T14:30:00Z", "12h");
    // The exact output depends on locale/timezone but should contain AM/PM
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it("formats time in 24-hour mode", () => {
    const result = formatTaskTime("2026-02-16T14:30:00Z", "24h");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("returns empty string for invalid dates", () => {
    expect(formatTaskTime("invalid", "12h")).toBe("");
  });
});
