import assert from "node:assert/strict";
import { test } from "node:test";

import { parseAsAtFromTitle } from "./as-at.ts";

test("reads the trailing date from a register title", () => {
  assert.equal(
    parseAsAtFromTitle("List of registered providers – 17 September 2026"),
    "2026-09-17",
  );
});

test("pads single-digit days", () => {
  assert.equal(
    parseAsAtFromTitle("List of registered providers – 3 March 2026"),
    "2026-03-03",
  );
});

test("throws when the title has no trailing date", () => {
  assert.throws(() =>
    parseAsAtFromTitle(
      "List of registered providers – 17 September 2026 (accessible version)",
    ),
  );
});

test("throws on an unrecognised month", () => {
  assert.throws(() =>
    parseAsAtFromTitle("List of registered providers – 17 Sept 2026"),
  );
});
