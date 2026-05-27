import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analyze, analyzeDecisions, normalizeInput } from "../src/analyze.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { AccessReviewInstance, ReviewInput } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixture = (name: string): ReviewInput =>
  JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as ReviewInput;

// Pin "now" so age-dependent rules are deterministic.
const NOW = "2026-05-29T00:00:00Z";

describe("analyze", () => {
  it("counts decisions and instances", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    expect(r.instances).toBe(1);
    expect(r.decisions).toBe(4);
    expect(r.decisionsByState.notReviewed).toBe(1);
    expect(r.decisionsByState.approve).toBe(3);
  });

  it("flags a self-review on a privileged role as high", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    const self = r.findings.filter((f) => f.code === "reviewer-self-review");
    expect(self).toHaveLength(1);
    expect(self[0].severity).toBe("high");
    expect(self[0].principal).toContain("carol");
  });

  it("flags a privileged-role auto-approval (approve with no reviewer) as high", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    const auto = r.findings.filter((f) => f.code === "privileged-role-auto-approved");
    expect(auto).toHaveLength(1);
    expect(auto[0].severity).toBe("high");
    expect(auto[0].principal).toContain("bob");
  });

  it("flags decision-overdue when instance closed > overdueAfterDays ago and decision is open", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW, overdueAfterDays: 10 });
    const od = r.findings.filter((f) => f.code === "decision-overdue");
    expect(od.length).toBeGreaterThanOrEqual(1);
    // The Super Administrator decision is still notReviewed -> must be high severity.
    expect(od.some((f) => f.severity === "high" && (f.resource ?? "").includes("Super Administrator"))).toBe(true);
  });

  it("flags instance-overdue when not completed past endDateTime", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    const io = r.findings.filter((f) => f.code === "instance-overdue");
    expect(io).toHaveLength(1);
  });

  it("flags stale-decision when reviewed but never applied past staleAfterDays", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW, staleAfterDays: 30 });
    const stale = r.findings.filter((f) => f.code === "stale-decision");
    // Dave's group decision was reviewed 2026-03-20, ~70 days before NOW, no appliedDateTime.
    expect(stale).toHaveLength(1);
    expect(stale[0].principal).toContain("dave");
  });

  it("surfaces high-risk-principal info findings for every privileged-role decision", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    const info = r.findings.filter((f) => f.code === "high-risk-principal");
    // 3 privileged roles in the fixture (super admin, security admin, help desk)
    expect(info).toHaveLength(3);
    for (const f of info) expect(f.severity).toBe("info");
  });

  it("counts openPrivilegedDecisions", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    expect(r.openPrivilegedDecisions).toBe(1); // only the notReviewed super admin row
  });

  it("reports ok=false when any high-severity finding exists", () => {
    const r = analyze(fixture("reviews.json"), { now: NOW });
    expect(r.ok).toBe(false);
  });

  it("reports ok=true on a clean fixture", () => {
    const r = analyze(fixture("reviews-clean.json"), { now: NOW });
    expect(r.findings.filter((f) => f.severity === "high")).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe("analyzeDecisions convenience", () => {
  it("wraps analyze for a flat decision list", () => {
    const r = analyzeDecisions(
      "inst-x",
      "InProgress",
      "2026-05-15T00:00:00Z",
      [
        {
          id: "d1",
          principal: { id: "p1", type: "user" },
          resource: { id: "r1" },
          decision: "notReviewed"
        }
      ],
      { now: NOW, overdueAfterDays: 10 }
    );
    expect(r.instances).toBe(1);
    expect(r.decisions).toBe(1);
    // No UPN / displayName supplied — finding should fall through to principal.id and resource.id.
    const overdue = r.findings.find((f) => f.code === "decision-overdue");
    expect(overdue?.principal).toBe("p1");
    expect(overdue?.resource).toBe("r1");
  });

  it("handles a principal with no type field gracefully (treated as user for the privileged-info rule)", () => {
    const r = analyzeDecisions(
      "inst-y",
      "InProgress",
      "2026-05-15T00:00:00Z",
      [
        {
          id: "d2",
          principal: { id: "p2" },
          resource: {
            id: "role-ga",
            type: "role",
            roleTemplateId: "okta-super-admin"
          },
          decision: "notReviewed"
        }
      ],
      { now: NOW }
    );
    // high-risk-principal info finding fires even when principal.type is undefined.
    expect(r.findings.some((f) => f.code === "high-risk-principal")).toBe(true);
  });

  it("does not flag self-review when reviewer reviews a group (no principal.type === user)", () => {
    const r = analyzeDecisions(
      "inst-z",
      "InProgress",
      "2026-05-15T00:00:00Z",
      [
        {
          id: "d3",
          principal: { id: "group-1", type: "group" },
          resource: { id: "role-other", type: "role", roleTemplateId: "not-privileged" },
          decision: "approve",
          reviewedBy: { id: "group-1" }
        }
      ],
      { now: NOW }
    );
    expect(r.findings.filter((f) => f.code === "reviewer-self-review")).toEqual([]);
  });
});

describe("normalizeInput", () => {
  it("accepts a single instance", () => {
    const inst: AccessReviewInstance = {
      id: "x",
      status: "Completed",
      startDateTime: "2026-05-01T00:00:00Z",
      endDateTime: "2026-05-15T00:00:00Z",
      decisions: []
    };
    expect(normalizeInput(inst)).toEqual([inst]);
  });
  it("accepts an array", () => {
    expect(normalizeInput([])).toEqual([]);
  });
  it("accepts a collection envelope", () => {
    expect(normalizeInput({ value: [] })).toEqual([]);
  });
});

describe("formatters", () => {
  it("toMarkdown lists findings sorted by severity (high first)", () => {
    const md = toMarkdown(analyze(fixture("reviews.json"), { now: NOW }));
    expect(md).toContain("❌");
    expect(md).toContain("reviewer-self-review");
    const highIdx = md.indexOf("🔴");
    const mediumIdx = md.indexOf("🟠");
    const infoIdx = md.indexOf("ℹ️");
    expect(highIdx).toBeLessThan(infoIdx);
    if (mediumIdx >= 0) expect(highIdx).toBeLessThan(mediumIdx);
  });

  it("toMarkdown renders ✅ on a clean fixture", () => {
    const md = toMarkdown(analyze(fixture("reviews-clean.json"), { now: NOW }));
    expect(md).toContain("✅");
    expect(md).toContain("No findings.");
  });

  it("toSummary emits a one-liner with counts and ok/fail", () => {
    expect(toSummary(analyze(fixture("reviews.json"), { now: NOW }))).toMatch(/^1 instance · 4 decisions/);
    expect(toSummary(analyze(fixture("reviews-clean.json"), { now: NOW }))).toContain("ok");
  });
});
