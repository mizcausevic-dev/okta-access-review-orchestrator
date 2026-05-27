import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  accessRisks,
  payload,
  remediationPosture,
  reviewLane,
  summary,
  verification
} from "../src/services/oktaAccessReviewOrchestratorService.js";
import {
  renderAccessRisks,
  renderDocs,
  renderOverview,
  renderRemediationPosture,
  renderReviewLane,
  renderVerification
} from "../src/services/render.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "site");

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, "api", "dashboard"), { recursive: true });
fs.copyFileSync(path.join(root, "CNAME"), path.join(outputDir, "CNAME"));

const pages: Record<string, string> = {
  "index.html": renderOverview(),
  [path.join("review-lane", "index.html")]: renderReviewLane(),
  [path.join("access-risks", "index.html")]: renderAccessRisks(),
  [path.join("remediation-posture", "index.html")]: renderRemediationPosture(),
  [path.join("verification", "index.html")]: renderVerification(),
  [path.join("docs", "index.html")]: renderDocs()
};

for (const [relativePath, html] of Object.entries(pages)) {
  const fullPath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html, "utf8");
}

const apiPayloads: Record<string, unknown> = {
  [path.join("api", "dashboard", "summary.json")]: summary(),
  [path.join("api", "review-lane.json")]: reviewLane(),
  [path.join("api", "access-risks.json")]: accessRisks(),
  [path.join("api", "remediation-posture.json")]: remediationPosture(),
  [path.join("api", "verification.json")]: verification(),
  [path.join("api", "sample.json")]: payload()
};

for (const [relativePath, data] of Object.entries(apiPayloads)) {
  const fullPath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf8");
}
