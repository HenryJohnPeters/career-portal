import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canWritePrivateDraft,
  clearPrivateDrafts,
  privateDraftOwner,
  setPrivateDraftOwner,
} from "./private-drafts";

test("drafts are writable only for the account they were opened under", () => {
  setPrivateDraftOwner("user-a");
  const openedBy = privateDraftOwner();
  assert.equal(canWritePrivateDraft(openedBy), true);

  // Another account signed in (e.g. in another tab).
  setPrivateDraftOwner("user-b");
  assert.equal(canWritePrivateDraft(openedBy), false);
});

test("sign-out blocks every write, including the unmount flush that runs after it", () => {
  setPrivateDraftOwner("user-a");
  const openedBy = privateDraftOwner();
  clearPrivateDrafts();
  assert.equal(privateDraftOwner(), null);
  assert.equal(canWritePrivateDraft(openedBy), false);
  assert.equal(canWritePrivateDraft(null), false);
});
