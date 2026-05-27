#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { analyze } from "./analyze.js";
import { toMarkdown, toSummary } from "./format.js";
import type { ControlPlaneOptions, ReviewInput } from "./types.js";

type Format = "json" | "markdown" | "summary";

interface Args {
  input?: string;
  format: Format;
  now?: string;
  overdueAfterDays?: number;
  staleAfterDays?: number;
  failOnHigh: boolean;
  out?: string;
  help: boolean;
}

const FORMATS: Format[] = ["json", "markdown", "summary"];

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "json", failOnHigh: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (arg === "--format") {
      const value = argv[++index] as Format;
      if (!FORMATS.includes(value)) {
        throw new Error(`--format must be one of: ${FORMATS.join(", ")}`);
      }
      args.format = value;
    } else if (arg === "--now") {
      args.now = argv[++index];
    } else if (arg === "--overdue-after-days") {
      args.overdueAfterDays = Number(argv[++index]);
    } else if (arg === "--stale-after-days") {
      args.staleAfterDays = Number(argv[++index]);
    } else if (arg === "--fail-on-high") {
      args.failOnHigh = true;
    } else if (arg === "--out") {
      args.out = argv[++index];
    } else if (!arg.startsWith("-")) {
      args.input = arg;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return args;
}

const HELP = `okta-access-review-orchestrator — analyze Okta access-review exports

Usage:
  okta-access-review <export.json> [--format json|markdown|summary]
                                   [--now <iso>] [--overdue-after-days N]
                                   [--stale-after-days N] [--fail-on-high]
                                   [--out FILE]

Input:
  Access-review export JSON — accepts a single instance, an array of instances,
  or the standard \`{ "value": [ ... ] }\` collection envelope.

Findings:
  - high     privileged-role decision auto-approved with no reviewer; reviewer
             self-review on a privileged role; instance overdue beyond threshold
  - medium   decision-overdue, reviewer-self-review on a standard role,
             stale-decision (reviewed but never applied)
  - info     high-risk-principal — every privileged-role decision is surfaced

Exit code:
  0 — no high-severity findings (or --fail-on-high not set)
  1 — high-severity finding present AND --fail-on-high set
  2 — usage / I/O error`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    return 2;
  }

  if (args.help || !args.input) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let payload: ReviewInput;
  try {
    payload = JSON.parse(readFileSync(args.input, "utf8")) as ReviewInput;
  } catch (error) {
    process.stderr.write(`error reading input: ${(error as Error).message}\n`);
    return 2;
  }

  const options: ControlPlaneOptions = {};
  if (args.now) {
    options.now = args.now;
  }
  if (args.overdueAfterDays !== undefined) {
    options.overdueAfterDays = args.overdueAfterDays;
  }
  if (args.staleAfterDays !== undefined) {
    options.staleAfterDays = args.staleAfterDays;
  }

  const report = analyze(payload, options);
  const output =
    args.format === "json"
      ? JSON.stringify(report, null, 2)
      : args.format === "markdown"
        ? toMarkdown(report)
        : toSummary(report);

  if (args.out) {
    writeFileSync(args.out, `${output}\n`, "utf8");
  } else {
    process.stdout.write(`${output}\n`);
  }

  return args.failOnHigh && !report.ok ? 1 : 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`fatal: ${(error as Error).message}\n`);
    process.exit(2);
  }
}
