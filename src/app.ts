// SPDX-License-Identifier: AGPL-3.0-or-later

import express from "express";
import { fileURLToPath } from "node:url";

import {
  accessRisks,
  payload,
  remediationPosture,
  reviewLane,
  summary,
  verification
} from "./services/oktaAccessReviewOrchestratorService.js";
import {
  renderAccessRisks,
  renderDocs,
  renderOverview,
  renderRemediationPosture,
  renderReviewLane,
  renderVerification
} from "./services/render.js";

const app = express();
const port = Number(process.env.PORT ?? 5511);
const host = process.env.HOST || "0.0.0.0";

app.get("/", (_req, res) => res.type("html").send(renderOverview()));
app.get("/review-lane", (_req, res) => res.type("html").send(renderReviewLane()));
app.get("/access-risks", (_req, res) => res.type("html").send(renderAccessRisks()));
app.get("/remediation-posture", (_req, res) => res.type("html").send(renderRemediationPosture()));
app.get("/verification", (_req, res) => res.type("html").send(renderVerification()));
app.get("/docs", (_req, res) => res.type("html").send(renderDocs()));

app.get("/api/dashboard/summary", (_req, res) => res.json(summary()));
app.get("/api/review-lane", (_req, res) => res.json(reviewLane()));
app.get("/api/access-risks", (_req, res) => res.json(accessRisks()));
app.get("/api/remediation-posture", (_req, res) => res.json(remediationPosture()));
app.get("/api/verification", (_req, res) => res.json(verification()));
app.get("/api/sample", (_req, res) => res.json(payload()));

const currentFile = fileURLToPath(import.meta.url);
const invokedDirectly = process.argv[1] !== undefined && currentFile === process.argv[1];

if (invokedDirectly) {
  app.listen(port, host, () => {
    console.log(`Okta Access Review Orchestrator listening on http://${host}:${port}`);
  });
}

export default app;
