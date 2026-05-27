// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "vitest";

import {
  accessRisks,
  remediationPosture,
  reviewLane,
  summary,
  verification
} from "./services/oktaAccessReviewOrchestratorService.js";

describe("okta-access-review-orchestrator dashboard services", () => {
  test("returns a recruiter-readable governance recommendation", () => {
    expect(summary().recommendation).toMatch(/admin/i);
  });

  test("maps multiple review lanes with owners and next actions", () => {
    expect(reviewLane().length).toBeGreaterThan(2);
    expect(reviewLane().every((lane) => lane.owner.length > 0)).toBe(true);
  });

  test("surfaces high severity access risks and remediation packets", () => {
    expect(accessRisks().some((finding) => finding.severity === "high")).toBe(true);
    expect(remediationPosture().some((packet) => packet.status === "red")).toBe(true);
  });

  test("keeps verification posture honest about synthetic sample data", () => {
    expect(verification().some((item) => item.toLowerCase().includes("synthetic"))).toBe(true);
  });
});
