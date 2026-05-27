// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "vitest";

import {
  renderAccessRisks,
  renderDocs,
  renderOverview,
  renderRemediationPosture,
  renderReviewLane,
  renderVerification
} from "./render.js";

describe("render", () => {
  test("overview contains control-plane framing", () => {
    expect(renderOverview()).toContain("Okta access reviews, admin decisions");
  });

  test("detail pages expose their lane names", () => {
    expect(renderReviewLane()).toContain("Review Lane");
    expect(renderAccessRisks()).toContain("Access Risks");
    expect(renderRemediationPosture()).toContain("Remediation Posture");
    expect(renderVerification()).toContain("Verification");
    expect(renderDocs()).toContain("Offline access-review analysis");
  });
});
