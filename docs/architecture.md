# Architecture

`okta-access-review-orchestrator` has two layers:

1. An offline analyzer and CLI for access-review exports
   - reads synthetic review instances and decisions
   - computes overdue decisions, self-approval risk, stale application gaps, admin-role exposure, and late closeout

2. A static operator surface
   - renders review-lane, access-risk, remediation, verification, and docs views
   - mirrors the same analyzer outputs through machine-readable API payloads
   - ships with crawlable SEO assets and proof screenshots
