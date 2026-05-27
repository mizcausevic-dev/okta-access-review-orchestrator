# Security Policy

`okta-access-review-orchestrator` includes:

- an offline analyzer and CLI for access-review exports
- a static public operator surface generated from synthetic sample data

It does **not** include tenant credentials, live review APIs, privileged write paths, or production admin integrations.

## Supported Versions

Only the latest `main` branch and newest release tag are supported for security fixes.

## Reporting a Vulnerability

- Treat real review exports as sensitive tenant data.
- Redact any production identifiers before filing an issue.
- Use GitHub security advisories for any issue that could expose tokens, tenant metadata, or hidden write behavior:
  - [Open a security advisory](https://github.com/mizcausevic-dev/okta-access-review-orchestrator/security/advisories/new)
