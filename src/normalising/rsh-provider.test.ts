import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normaliseDesignation,
  normaliseRshNumber,
  normaliseRshProvider,
} from "./rsh-provider.ts";

test("uppercases and trims RSH numbers", () => {
  assert.equal(normaliseRshNumber(" lh0391 "), "LH0391");
});

test("keeps plain-digit RSH numbers as strings", () => {
  assert.equal(normaliseRshNumber("4758"), "4758");
});

test("maps each raw designation to the plan's enum", () => {
  assert.equal(normaliseDesignation("Non-profit"), "non-profit");
  assert.equal(normaliseDesignation("Profit"), "for-profit");
  assert.equal(normaliseDesignation("Local authority"), "local-authority");
});

test("normalises a spreadsheet row without touching name or corporate form", () => {
  assert.deepEqual(
    normaliseRshProvider({
      "Organisation name": "The Skinners'  Almshouse Charity",
      "Registration number": "a3909",
      "Registration date": "1999-11-23",
      Designation: "Non-profit",
      "Corporate form": "Charitable incorporated organisation",
      Notes: "",
    }),
    {
      orgName: "The Skinners'  Almshouse Charity",
      registrationNumber: "A3909",
      registrationDate: "1999-11-23",
      designation: "non-profit",
      corporateForm: "Charitable incorporated organisation",
      notes: "",
    },
  );
});
