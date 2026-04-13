import { describe, it, expect } from "vitest";
import type { LogLine, LogLineType } from "../lib/types";
import { findScrollIndex } from "../lib/scroll-utils";

function makeLine(lineNumber: number, type: LogLineType = "system"): LogLine {
  return {
    lineNumber,
    raw: `line ${lineNumber}`,
    timestamp: null,
    timestampDate: null,
    type,
    content: `line ${lineNumber}`,
    eventName: null,
  };
}

describe("scroll preservation on filter change", () => {
  it("finds exact line when it exists in filtered set", () => {
    const lines = [makeLine(1), makeLine(5), makeLine(10), makeLine(15)];
    expect(findScrollIndex(lines, 10)).toBe(2);
  });

  it("finds next line when exact line is filtered out", () => {
    // Lines 6, 7, 8, 9 are filtered out — should land on line 10
    const lines = [makeLine(1), makeLine(5), makeLine(10), makeLine(15)];
    expect(findScrollIndex(lines, 7)).toBe(2); // next line >= 7 is line 10 at idx 2
  });

  it("stays at top when target is line 1", () => {
    const lines = [makeLine(1), makeLine(5), makeLine(10)];
    expect(findScrollIndex(lines, 1)).toBe(0);
  });

  it("goes to last line when target is past the end", () => {
    const lines = [makeLine(1), makeLine(5), makeLine(10)];
    expect(findScrollIndex(lines, 100)).toBe(2);
  });

  it("returns 0 for empty lines", () => {
    expect(findScrollIndex([], 1)).toBe(0);
  });

  it("handles target before all lines", () => {
    // File starts at line 50 (e.g., after some startup lines were filtered)
    const lines = [makeLine(50), makeLine(51), makeLine(52)];
    expect(findScrollIndex(lines, 1)).toBe(0);
  });

  it("preserves position when toggling a filter that removes some lines", () => {
    // Scenario: user is at line 500, toggles off "appearance" type
    // User is viewing line 500
    const currentLine = 500;

    // After filtering out "appearance", only system lines remain
    const afterFilter = [
      makeLine(498, "system"),
      makeLine(500, "system"),
      makeLine(502, "system"),
    ];

    const targetIdx = findScrollIndex(afterFilter, currentLine);
    expect(targetIdx).toBe(1); // line 500 is at index 1 in filtered set
    expect(afterFilter[targetIdx].lineNumber).toBe(500);
  });

  it("lands on next visible line when current line gets filtered out", () => {
    const currentLine = 499; // this was an "appearance" line

    const afterFilter = [
      makeLine(498, "system"),
      makeLine(500, "system"),
      makeLine(502, "system"),
    ];

    const targetIdx = findScrollIndex(afterFilter, currentLine);
    expect(targetIdx).toBe(1); // next line >= 499 is 500
    expect(afterFilter[targetIdx].lineNumber).toBe(500);
  });
});
