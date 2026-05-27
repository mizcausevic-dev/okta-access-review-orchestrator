// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReviewInput } from "../types.js";

export interface ReviewLanePacket {
  instanceId: string;
  owner: string;
  cadence: string;
  reviewScope: string;
  nextAction: string;
  note: string;
}

export interface RemediationPacket {
  packetId: string;
  lane: string;
  owner: string;
  completenessScore: number;
  status: "red" | "yellow" | "green";
  blocker: string;
  launchWindowHours: number;
  decisionNote: string;
}

export const sampleReviewPayload: ReviewInput = {
  value: [
    {
      id: "campaign-2026-05-admin",
      reviewName: "Okta admin roles Q2 closeout",
      startDateTime: "2026-05-01T00:00:00Z",
      endDateTime: "2026-05-15T00:00:00Z",
      status: "InProgress",
      decisions: [
        {
          id: "dec-1",
          principal: {
            id: "u-alice",
            displayName: "Alice Admin",
            userPrincipalName: "alice@kgtenant.example",
            type: "user"
          },
          resource: {
            id: "role-super-admin",
            displayName: "Super Administrator",
            type: "role",
            roleTemplateId: "okta-super-admin"
          },
          decision: "notReviewed"
        },
        {
          id: "dec-2",
          principal: {
            id: "u-bob",
            displayName: "Bob Platform",
            userPrincipalName: "bob@kgtenant.example",
            type: "user"
          },
          resource: {
            id: "role-security-admin",
            displayName: "Security Administrator",
            type: "role",
            roleTemplateId: "okta-security-admin"
          },
          decision: "approve",
          reviewedDateTime: "2026-05-10T12:00:00Z"
        },
        {
          id: "dec-3",
          principal: {
            id: "u-carol",
            displayName: "Carol Helpdesk",
            userPrincipalName: "carol@kgtenant.example",
            type: "user"
          },
          resource: {
            id: "role-helpdesk-admin",
            displayName: "Help Desk Administrator",
            type: "role",
            roleTemplateId: "okta-helpdesk-admin"
          },
          decision: "approve",
          reviewedBy: { "id": "u-carol", "displayName": "Carol Helpdesk" },
          reviewedDateTime: "2026-05-09T09:00:00Z"
        }
      ]
    },
    {
      id: "campaign-2026-04-apps",
      reviewName: "External users and app assignments",
      startDateTime: "2026-04-18T00:00:00Z",
      endDateTime: "2026-05-10T00:00:00Z",
      status: "Completed",
      decisions: [
        {
          id: "dec-4",
          principal: {
            id: "u-dave",
            displayName: "Dave Vendor",
            userPrincipalName: "dave.vendor@example.net",
            type: "user"
          },
          resource: {
            id: "app-finance-bi",
            displayName: "Finance BI",
            type: "app"
          },
          decision: "approve",
          reviewedBy: { "id": "u-elena", "displayName": "Elena Director" },
          reviewedDateTime: "2026-03-20T10:00:00Z"
        },
        {
          id: "dec-5",
          principal: {
            id: "u-farrah",
            displayName: "Farrah Guest",
            userPrincipalName: "farrah.partner@example.org",
            type: "user"
          },
          resource: {
            id: "app-powerbi-embed",
            displayName: "Embedded Insights Portal",
            type: "app"
          },
          decision: "notNotified"
        }
      ]
    },
    {
      id: "campaign-2026-05-breakglass",
      reviewName: "Break-glass admins and privileged groups",
      startDateTime: "2026-05-07T00:00:00Z",
      endDateTime: "2026-05-28T00:00:00Z",
      status: "Auto-Reviewed",
      decisions: [
        {
          id: "dec-6",
          principal: {
            id: "u-gina",
            displayName: "Gina Ops",
            userPrincipalName: "gina@kgtenant.example",
            type: "user"
          },
          resource: {
            id: "role-org-admin",
            displayName: "Organization Administrator",
            type: "role",
            roleTemplateId: "okta-org-admin"
          },
          decision: "approve",
          reviewedBy: { "id": "u-harold", "displayName": "Harold Reviewer" },
          reviewedDateTime: "2026-05-20T15:00:00Z",
          appliedDateTime: "2026-05-22T18:00:00Z"
        }
      ]
    }
  ]
};

export const reviewLanePackets: ReviewLanePacket[] = [
  {
    instanceId: "campaign-2026-05-admin",
    owner: "Okta Governance",
    cadence: "Quarterly",
    reviewScope: "Admin roles · core tenant",
    nextAction: "Escalate open Super Admin decision and require dual-control for admin-role closeout.",
    note: "Admin review still shows a self-review and an approval with no reviewer evidence."
  },
  {
    instanceId: "campaign-2026-04-apps",
    owner: "Identity Operations",
    cadence: "Monthly",
    reviewScope: "External users + app assignments",
    nextAction: "Close stale app assignments and guest review gaps before the next export packet.",
    note: "Guest and app-assignment reviews need better notification and application proof."
  },
  {
    instanceId: "campaign-2026-05-breakglass",
    owner: "Platform Security",
    cadence: "Monthly",
    reviewScope: "Break-glass admins + privileged groups",
    nextAction: "Validate reviewer independence and archive clean evidence for the next audit run.",
    note: "This lane is the healthiest posture, but it still needs evidence packaging."
  }
];

export const remediationPackets: RemediationPacket[] = [
  {
    packetId: "RP-11",
    lane: "Okta admin roles Q2 closeout",
    owner: "Okta Governance",
    completenessScore: 52,
    status: "red",
    blocker: "Open Super Admin decision and unverified admin-role approval path",
    launchWindowHours: 10,
    decisionNote: "Hold privileged closeout until dual-review proof and application evidence are attached."
  },
  {
    packetId: "RP-18",
    lane: "External users and app assignments",
    owner: "Identity Operations",
    completenessScore: 71,
    status: "yellow",
    blocker: "Stale app-assignment review and not-notified guest decision",
    launchWindowHours: 26,
    decisionNote: "Clear guest notification gaps and stale application evidence before the next compliance export."
  },
  {
    packetId: "RP-24",
    lane: "Break-glass admins",
    owner: "Platform Security",
    completenessScore: 93,
    status: "green",
    blocker: "No active blocker",
    launchWindowHours: 72,
    decisionNote: "Packet is safe for governed archive and reviewer-attestation export."
  }
];
