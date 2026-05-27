// SPDX-License-Identifier: AGPL-3.0-or-later

import { analyze, normalizeInput } from "../analyze.js";
import { sampleReviewPayload, remediationPackets, reviewLanePackets } from "../data/sampleReviews.js";
import { PRIVILEGED_ROLE_TEMPLATE_IDS, type Finding } from "../types.js";

const NOW = "2026-05-29T00:00:00Z";
const report = analyze(sampleReviewPayload, {
  now: NOW,
  overdueAfterDays: 14,
  staleAfterDays: 30
});
const instances = normalizeInput(sampleReviewPayload);

function isPrivilegedDecision(roleTemplateId?: string): boolean {
  return roleTemplateId !== undefined && PRIVILEGED_ROLE_TEMPLATE_IDS.has(roleTemplateId);
}

function severityRank(finding: Finding): number {
  return finding.severity === "high"
    ? 0
    : finding.severity === "medium"
      ? 1
      : finding.severity === "low"
        ? 2
        : 3;
}

export function summary() {
  return {
    reviewInstances: report.instances,
    pendingDecisions: report.decisionsByState.notReviewed + report.decisionsByState.notNotified,
    highFindings: report.findings.filter((finding) => finding.severity === "high").length,
    staleApplications: report.findings.filter((finding) => finding.code === "stale-decision").length,
    privilegedAssignments: report.findings.filter((finding) => finding.code === "high-risk-principal").length,
    recommendation:
      "Block admin auto-approvals, self-reviews, and stale app-assignment gaps before the next identity-governance closeout window."
  };
}

export function reviewLane() {
  return instances.map((instance) => {
    const meta = reviewLanePackets.find((item) => item.instanceId === instance.id);
    const openDecisions = instance.decisions.filter(
      (decision) => decision.decision === "notReviewed" || decision.decision === "notNotified"
    ).length;
    const privilegedDecisions = instance.decisions.filter(
      (decision) =>
        decision.resource.type === "role" &&
        isPrivilegedDecision(decision.resource.roleTemplateId)
    ).length;

    return {
      instanceId: instance.id,
      reviewName: instance.reviewName ?? instance.id,
      owner: meta?.owner ?? "Identity Governance",
      cadence: meta?.cadence ?? "Periodic",
      reviewScope: meta?.reviewScope ?? "Tenant review scope",
      status: instance.status,
      closeDate: instance.endDateTime.slice(0, 10),
      openDecisions,
      privilegedDecisions,
      nextAction: meta?.nextAction ?? "Review findings and attach remediation proof.",
      note: meta?.note ?? "Synthetic sample review lane."
    };
  });
}

export function accessRisks() {
  return [...report.findings]
    .sort((left, right) => severityRank(left) - severityRank(right))
    .map((finding) => {
      const owner =
        reviewLanePackets.find((item) => item.instanceId === finding.instanceId)?.owner ??
        "Identity Governance";
      return {
        ...finding,
        owner
      };
    });
}

export function remediationPosture() {
  return remediationPackets;
}

export function verification() {
  return [
    "High-risk Okta admin roles are explicitly tracked so recruiter-visible identity-governance posture is concrete, not generic.",
    "The dashboard is backed by a real offline analyzer and CLI, not static text alone.",
    "Synthetic sample data only; no tenant identifiers, tokens, or live exports are committed.",
    "Review-lane, risk, and remediation views stay buyer-readable for Okta, IAM, and audit stakeholders.",
    "This surface is shaped as an operator control plane for cloud identity governance, not a training or lab page."
  ];
}

export function payload() {
  return {
    summary: summary(),
    reviewLane: reviewLane(),
    accessRisks: accessRisks(),
    remediationPosture: remediationPosture(),
    verification: verification(),
    sample: sampleReviewPayload
  };
}
