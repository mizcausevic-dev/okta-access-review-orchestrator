// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  PRIVILEGED_ROLE_TEMPLATE_IDS,
  type AccessReviewDecision,
  type AccessReviewInstance,
  type ControlPlaneOptions,
  type ControlPlaneReport,
  type DecisionState,
  type Finding,
  type InstanceStatus,
  type ReviewInput
} from "./types.js";

const DAY_MS = 86_400_000;

const DECISION_STATES: DecisionState[] = [
  "approve",
  "deny",
  "dontKnow",
  "notReviewed",
  "notNotified"
];

const INSTANCE_STATUSES: InstanceStatus[] = [
  "NotStarted",
  "Initializing",
  "InProgress",
  "Completing",
  "Completed",
  "Auto-Reviewing",
  "Auto-Reviewed"
];

function emptyDecisionCounts(): Record<DecisionState, number> {
  const out = {} as Record<DecisionState, number>;
  for (const state of DECISION_STATES) {
    out[state] = 0;
  }
  return out;
}

function emptyInstanceCounts(): Record<InstanceStatus, number> {
  const out = {} as Record<InstanceStatus, number>;
  for (const state of INSTANCE_STATUSES) {
    out[state] = 0;
  }
  return out;
}

export function normalizeInput(input: ReviewInput): AccessReviewInstance[] {
  if (Array.isArray(input)) {
    return input;
  }

  if ("value" in input && Array.isArray((input as { value: AccessReviewInstance[] }).value)) {
    return (input as { value: AccessReviewInstance[] }).value;
  }

  return [input as AccessReviewInstance];
}

export function analyze(input: ReviewInput, opts: ControlPlaneOptions = {}): ControlPlaneReport {
  const now = opts.now ? new Date(opts.now) : new Date();
  const overdueAfter = (opts.overdueAfterDays ?? 14) * DAY_MS;
  const staleAfter = (opts.staleAfterDays ?? 30) * DAY_MS;

  const instances = normalizeInput(input);
  const findings: Finding[] = [];
  const decisionsByState = emptyDecisionCounts();
  const instancesByStatus = emptyInstanceCounts();
  let totalDecisions = 0;
  let openPrivilegedDecisions = 0;

  for (const instance of instances) {
    if (instance.status in instancesByStatus) {
      instancesByStatus[instance.status] += 1;
    }

    const endDate = new Date(instance.endDateTime);
    const overdueByMs = now.getTime() - endDate.getTime();

    if (instance.status !== "Completed" && instance.status !== "Auto-Reviewed" && overdueByMs > 0) {
      findings.push({
        code: "instance-overdue",
        severity: overdueByMs > overdueAfter ? "high" : "medium",
          message: `Access-review campaign closed ${Math.round(overdueByMs / DAY_MS)} day(s) ago and still ${instance.status}.`,
        instanceId: instance.id
      });
    }

    for (const decision of instance.decisions ?? []) {
      totalDecisions += 1;
      if (decision.decision in decisionsByState) {
        decisionsByState[decision.decision] += 1;
      }

      const isPrivileged =
        decision.resource.type === "role" &&
        decision.resource.roleTemplateId !== undefined &&
        PRIVILEGED_ROLE_TEMPLATE_IDS.has(decision.resource.roleTemplateId);

      const isOpen = decision.decision === "notReviewed" || decision.decision === "notNotified";
      if (isOpen && isPrivileged) {
        openPrivilegedDecisions += 1;
      }

      if (isOpen && overdueByMs > overdueAfter) {
        findings.push({
          code: "decision-overdue",
          severity: isPrivileged ? "high" : "medium",
          message: `Decision pending for ${decision.principal.displayName ?? decision.principal.id} on ${decision.resource.displayName ?? decision.resource.id}.`,
          instanceId: instance.id,
          decisionId: decision.id,
          principal: decision.principal.userPrincipalName ?? decision.principal.id,
          resource: decision.resource.displayName ?? decision.resource.id
        });
      }

      if (isPrivileged && decision.decision === "approve" && decision.reviewedBy === undefined) {
        findings.push({
          code: "privileged-role-auto-approved",
          severity: "high",
          message: "Admin-role decision approved with no recorded reviewer (likely auto-approval).",
          instanceId: instance.id,
          decisionId: decision.id,
          principal: decision.principal.userPrincipalName ?? decision.principal.id,
          resource: decision.resource.displayName ?? decision.resource.id
        });
      }

      if (
        decision.reviewedBy?.id &&
        decision.principal.type === "user" &&
        decision.reviewedBy.id === decision.principal.id
      ) {
        findings.push({
          code: "reviewer-self-review",
          severity: isPrivileged ? "high" : "medium",
          message: `Reviewer ${decision.reviewedBy.displayName ?? decision.reviewedBy.id} approved or denied their own access.`,
          instanceId: instance.id,
          decisionId: decision.id,
          principal: decision.principal.userPrincipalName ?? decision.principal.id,
          resource: decision.resource.displayName ?? decision.resource.id
        });
      }

      if (decision.reviewedDateTime && !decision.appliedDateTime) {
        const reviewedAgeMs = now.getTime() - new Date(decision.reviewedDateTime).getTime();
        if (reviewedAgeMs > staleAfter) {
          findings.push({
            code: "stale-decision",
            severity: "medium",
            message: `Decision reviewed ${Math.round(reviewedAgeMs / DAY_MS)} day(s) ago but never applied.`,
            instanceId: instance.id,
            decisionId: decision.id,
            principal: decision.principal.userPrincipalName ?? decision.principal.id,
            resource: decision.resource.displayName ?? decision.resource.id
          });
        }
      }

      if (isPrivileged && (decision.principal.type === "user" || decision.principal.type === undefined)) {
        findings.push({
          code: "high-risk-principal",
          severity: "info",
          message: `Privileged assignment under review (${decision.resource.displayName ?? decision.resource.roleTemplateId}).`,
          instanceId: instance.id,
          decisionId: decision.id,
          principal: decision.principal.userPrincipalName ?? decision.principal.id,
          resource: decision.resource.displayName ?? decision.resource.id
        });
      }
    }
  }

  return {
    generatedAt: now.toISOString(),
    instances: instances.length,
    decisions: totalDecisions,
    decisionsByState,
    instancesByStatus,
    openPrivilegedDecisions,
    findings,
    ok: !findings.some((finding) => finding.severity === "high")
  };
}

export function analyzeDecisions(
  instanceId: string,
  status: InstanceStatus,
  endDateTime: string,
  decisions: AccessReviewDecision[],
  opts: ControlPlaneOptions = {}
): ControlPlaneReport {
  return analyze(
    { id: instanceId, status, decisions, startDateTime: endDateTime, endDateTime },
    opts
  );
}
