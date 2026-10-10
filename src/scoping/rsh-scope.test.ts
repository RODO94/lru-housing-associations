import assert from "node:assert/strict";
import { test } from "node:test";

import type { RshDesignation, SavedRshProvider } from "../schema.ts";
import { scopeRshProvider } from "./rsh-scope.ts";

const providerWith = (designation: RshDesignation): SavedRshProvider => ({
  orgName: "Example Housing Limited",
  registrationNumber: "L4240",
  registrationDate: "1999-11-23",
  designation,
  corporateForm: "Registered society",
  notes: "",
});

test("non-profit providers are in scope and not for-profit", () => {
  const scoped = scopeRshProvider(providerWith("non-profit"));
  assert.equal(scoped.inScope, true);
  assert.equal(scoped.isForProfit, false);
});

test("for-profit providers stay in scope, flagged", () => {
  const scoped = scopeRshProvider(providerWith("for-profit"));
  assert.equal(scoped.inScope, true);
  assert.equal(scoped.isForProfit, true);
});

test("local authorities are out of scope", () => {
  const scoped = scopeRshProvider(providerWith("local-authority"));
  assert.equal(scoped.inScope, false);
  assert.equal(scoped.isForProfit, false);
});
