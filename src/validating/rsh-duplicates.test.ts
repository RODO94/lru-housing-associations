import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertUniqueRegistrationNumbers,
  findDuplicateRegistrationNumbers,
} from "./rsh-duplicates.ts";

test("finds nothing when every number is unique", () => {
  assert.deepEqual(
    findDuplicateRegistrationNumbers([
      { registrationNumber: "L4240" },
      { registrationNumber: "4758" },
    ]),
    [],
  );
});

test("lists each duplicated number once, however often it repeats", () => {
  assert.deepEqual(
    findDuplicateRegistrationNumbers([
      { registrationNumber: "L4240" },
      { registrationNumber: "L4240" },
      { registrationNumber: "L4240" },
      { registrationNumber: "4758" },
      { registrationNumber: "4758" },
    ]),
    ["L4240", "4758"],
  );
});

test("throws naming the duplicates", () => {
  assert.throws(
    () =>
      assertUniqueRegistrationNumbers([
        { registrationNumber: "C3455" },
        { registrationNumber: "C3455" },
      ]),
    /C3455/,
  );
});
