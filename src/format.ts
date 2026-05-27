// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ControlPlaneReport, FindingSeverity } from "./types.js";

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  high: "🔴 high",
  medium: "🟠 medium",
  low: "🟡 low",
  info: "ℹ️ info"
};

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3
};

export function toMarkdown(report: ControlPlaneReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? "# Okta access-review orchestrator ✅" : "# Okta access-review orchestrator ❌");
  lines.push("");
  lines.push(`Generated: \`${report.generatedAt}\``);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(
    `- Instances: **${report.instances}** · Decisions: **${report.decisions}** · Open privileged decisions: **${report.openPrivilegedDecisions}**`
  );
  lines.push("");
  lines.push("## Decisions by state");
  lines.push("");
  lines.push("| approve | deny | dontKnow | notReviewed | notNotified |");
  lines.push("|---:|---:|---:|---:|---:|");
  lines.push(
    `| ${report.decisionsByState.approve} | ${report.decisionsByState.deny} | ${report.decisionsByState.dontKnow} | ${report.decisionsByState.notReviewed} | ${report.decisionsByState.notNotified} |`
  );

  const ranked = [...report.findings].sort(
    (left, right) => SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]
  );

  if (ranked.length === 0) {
    lines.push("");
    lines.push("No findings.");
    return lines.join("\n");
  }

  lines.push("");
  lines.push(`## Findings (${ranked.length})`);
  lines.push("");
  lines.push("| severity | code | principal | resource | message |");
  lines.push("|---|---|---|---|---|");
  for (const finding of ranked) {
    lines.push(
      `| ${SEVERITY_LABEL[finding.severity]} | \`${finding.code}\` | ${finding.principal ?? "—"} | ${finding.resource ?? "—"} | ${finding.message} |`
    );
  }

  return lines.join("\n");
}

export function toSummary(report: ControlPlaneReport): string {
  const counts: Record<FindingSeverity, number> = { high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of report.findings) {
    counts[finding.severity] += 1;
  }

  return `${report.instances} instance${report.instances === 1 ? "" : "s"} · ${report.decisions} decision${report.decisions === 1 ? "" : "s"} · ${counts.high} high · ${counts.medium} medium · ${counts.info} info (${report.ok ? "ok" : "fail"})`;
}
