import test from "node:test";
import assert from "node:assert/strict";

import { mergeSearchParams, positiveInt } from "../src/lib/search-state.js";

test("positiveInt returns fallback for invalid values", () => {
  assert.equal(positiveInt("-2", 3), 3);
  assert.equal(positiveInt("abc", 2), 2);
  assert.equal(positiveInt("5", 1), 5);
});

test("mergeSearchParams updates and removes params", () => {
  const result = mergeSearchParams("page=2&status=draft", {
    page: 1,
    status: "",
    q: "nda",
  });
  assert.equal(result, "page=1&q=nda");
});
