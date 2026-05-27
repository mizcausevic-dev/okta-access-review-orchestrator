// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Operator control-plane for Okta access reviews.
//
// Input shape: normalized review-export JSON

export type DecisionState =
  | "approve"
  | "deny"
  | "dontKnow"
  | "notReviewed"
  | "notNotified";

export type InstanceStatus =
  | "NotStarted"
  | "Initializing"
  | "InProgress"
  | "Completing"
  | "Completed"
  | "Auto-Reviewing"
  | "Auto-Reviewed";

export interface AccessReviewDecision {
  id: string;
  principal: {
    id: string;
    displayName?: string;
    userPrincipalName?: string;
    type?: "user" | "group" | "servicePrincipal";
  };
  resource: {
    id: string;
    displayName?: string;
    type?: "role" | "group" | "app";
    roleTemplateId?: string;
  };
  decision: DecisionState;
  reviewedBy?: { id: string; displayName?: string };
  reviewedDateTime?: string;
  appliedDateTime?: string;
}

export interface AccessReviewInstance {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status: InstanceStatus;
  decisions: AccessReviewDecision[];
  reviewName?: string;
}

export type ReviewInput =
  | AccessReviewInstance
  | AccessReviewInstance[]
  | { value: AccessReviewInstance[] };

export type FindingSeverity = "high" | "medium" | "low" | "info";

export type FindingCode =
  | "stale-decision"
  | "decision-overdue"
  | "high-risk-principal"
  | "privileged-role-auto-approved"
  | "reviewer-self-review"
  | "instance-overdue";

export interface Finding {
  code: FindingCode;
  severity: FindingSeverity;
  message: string;
  instanceId: string;
  decisionId?: string;
  principal?: string;
  resource?: string;
}

export interface ControlPlaneReport {
  generatedAt: string;
  instances: number;
  decisions: number;
  decisionsByState: Record<DecisionState, number>;
  instancesByStatus: Record<InstanceStatus, number>;
  openPrivilegedDecisions: number;
  findings: Finding[];
  ok: boolean;
}

export interface ControlPlaneOptions {
  now?: string;
  overdueAfterDays?: number;
  staleAfterDays?: number;
}

export const PRIVILEGED_ROLE_TEMPLATE_IDS: ReadonlySet<string> = new Set([
  "okta-super-admin",
  "okta-org-admin",
  "okta-app-admin",
  "okta-group-admin",
  "okta-security-admin",
  "okta-helpdesk-admin"
]);
