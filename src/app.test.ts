// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import app from "./app.js";

let server: ReturnType<typeof app.listen>;
let base = "";

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  const address = await new Promise<import("node:net").AddressInfo>((resolve, reject) => {
    server.once("listening", () => {
      const value = server.address();
      if (!value || typeof value === "string") {
        reject(new Error("Could not resolve listening address"));
        return;
      }
      resolve(value);
    });
    server.once("error", reject);
  });
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("app routes", () => {
  test("serves all html surfaces", async () => {
    const htmlRoutes = [
      "/",
      "/review-lane",
      "/access-risks",
      "/remediation-posture",
      "/verification",
      "/docs"
    ];

    for (const route of htmlRoutes) {
      const response = await fetch(`${base}${route}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
    }
  });

  test("serves all api payloads", async () => {
    const apiRoutes = [
      "/api/dashboard/summary",
      "/api/review-lane",
      "/api/access-risks",
      "/api/remediation-posture",
      "/api/verification",
      "/api/sample"
    ];

    for (const route of apiRoutes) {
      const response = await fetch(`${base}${route}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    }
  });
});
