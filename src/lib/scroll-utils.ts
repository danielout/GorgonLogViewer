import type { LogLine } from "./types";

/**
 * Find the index to scroll to in a filtered line array,
 * given a target original line number.
 *
 * Returns the index of the first line with lineNumber >= target.
 * If no such line exists, returns the last line's index.
 * Returns 0 for empty arrays.
 */
export function findScrollIndex(lines: LogLine[], targetLineNumber: number): number {
  if (lines.length === 0) return 0;
  let bestIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].lineNumber >= targetLineNumber) {
      return i;
    }
    bestIdx = i;
  }
  return bestIdx;
}
