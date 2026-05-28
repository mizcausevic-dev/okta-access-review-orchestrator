# Changelog

## v1.0.0-prod — 2026-05-27

- Production hardening pass: confirmed CI (lint, typecheck, coverage, build, npm audit) + Pages workflow are green on `main` at HEAD before tagging v1.0-prod.
- v0.1 already arrived with LICENSE (AGPL-3.0-or-later), `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/dependabot.yml` (npm + github-actions, weekly), and dual-Node 20/22 CI — Wave 13 baseline already at hardening parity with the rest of the multi-cloud lane.
- No `src/`, README narrative, docs, or screenshot edits — squad doctrine v1.1 respects the v0.1-shipped operator-surface as Codex shipped it.

## v0.1.0 - 2026-05-27

- Initial release: operator control plane for Okta access reviews, admin-role decisions, stale attestations, and remediation posture.
- Built public operator surface for Okta governance and identity-operations teams.
- Preserved the offline analyzer and CLI for review-export inspection.
- Deployed static control surface at `https://okta.kineticgain.com/` with:
  - `/`
  - `/review-lane`
  - `/access-risks`
  - `/remediation-posture`
  - `/verification`
  - `/docs`
- Includes API payloads, README screenshots, `docs/KINETIC_GAIN_EMBEDDED.md`, `robots.txt`, and `sitemap.xml`.
