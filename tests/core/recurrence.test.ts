import { describe, it, expect } from "vitest";
import { getNextOccurrence } from "../../src/core/recurrence.js";

const BASE = new Date("2025-01-15T10:00:00Z"); // Wednesday

describe("getNextOccurrence", () => {
  it("daily: returns next day", () => {
    const next = getNextOccurrence("daily", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(16);
  });

  it("weekly: returns 7 days later", () => {
    const next = getNextOccurrence("weekly", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(22);
  });

  it("monthly: returns next month same date", () => {
    const next = getNextOccurrence("monthly", BASE);
    expect(next).not.toBeNull();
    expect(next!.getMonth()).toBe(1); // February
    expect(next!.getDate()).toBe(15);
  });

  it("yearly: returns same date next year", () => {
    const next = getNextOccurrence("yearly", BASE);
    expect(next).not.toBeNull();
    expect(next!.getFullYear()).toBe(2026);
    expect(next!.getMonth()).toBe(0); // January
    expect(next!.getDate()).toBe(15);
  });

  it("yearly: handles leap year (Feb 29 → Mar 1)", () => {
    // 2024 is a leap year, Feb 29 exists
    const leapDay = new Date("2024-02-29T10:00:00Z");
    const next = getNextOccurrence("yearly", leapDay);
    expect(next).not.toBeNull();
    // 2025 is not a leap year — JS Date rolls Feb 29 → Mar 1
    expect(next!.getFullYear()).toBe(2025);
    expect(next!.getMonth()).toBe(2); // March
    expect(next!.getDate()).toBe(1);
  });

  it("weekdays: skips Saturday and Sunday", () => {
    // Friday Jan 17
    const friday = new Date("2025-01-17T10:00:00Z");
    const next = getNextOccurrence("weekdays", friday);
    expect(next).not.toBeNull();
    // Should be Monday Jan 20, not Saturday Jan 18
    expect(next!.getDay()).toBe(1); // Monday
    expect(next!.getDate()).toBe(20);
  });

  it("weekdays: Wednesday → Thursday", () => {
    const next = getNextOccurrence("weekdays", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDay()).toBe(4); // Thursday
    expect(next!.getDate()).toBe(16);
  });

  it("weekdays: Saturday → Monday", () => {
    const saturday = new Date("2025-01-18T10:00:00Z");
    const next = getNextOccurrence("weekdays", saturday);
    expect(next).not.toBeNull();
    expect(next!.getDay()).toBe(1); // Monday
    expect(next!.getDate()).toBe(20);
  });

  it("every N days", () => {
    const next = getNextOccurrence("every 3 days", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(18);
  });

  it("every 1 day", () => {
    const next = getNextOccurrence("every 1 day", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(16);
  });

  it("every N weeks", () => {
    const next = getNextOccurrence("every 2 weeks", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(29);
  });

  it("every 1 week", () => {
    const next = getNextOccurrence("every 1 week", BASE);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(22);
  });

  it("returns null for unrecognized recurrence", () => {
    expect(getNextOccurrence("biweekly", BASE)).toBeNull();
    expect(getNextOccurrence("", BASE)).toBeNull();
    expect(getNextOccurrence("every", BASE)).toBeNull();
    expect(getNextOccurrence("every 3 months", BASE)).toBeNull();
  });

  it("does not mutate the input date", () => {
    const original = new Date(BASE);
    getNextOccurrence("daily", BASE);
    expect(BASE.getTime()).toBe(original.getTime());
  });
});
