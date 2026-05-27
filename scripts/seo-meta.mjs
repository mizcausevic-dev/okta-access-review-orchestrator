import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const domain = process.argv[2] || "";
if (!domain) {
  console.log("seo-meta: no domain — skipping");
  process.exit(0);
}

if (!existsSync("site")) {
  console.log("seo-meta: no site/ dir");
  process.exit(0);
}

const description = (() => {
  try {
    return (JSON.parse(readFileSync("package.json", "utf8")).description || "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
})();

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function htmlFiles(root) {
  const found = [];
  for (const entry of readdirSync(root)) {
    const full = path.join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      found.push(...htmlFiles(full));
    } else if (entry.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

let count = 0;
for (const file of htmlFiles("site")) {
  let html = readFileSync(file, "utf8");
  if (html.includes('property="og:title"')) {
    continue;
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : domain;
  const relative = path.relative("site", file).replace(/\\/g, "/");
  const url =
    relative === "index.html"
      ? `https://${domain}/`
      : relative.endsWith("/index.html")
        ? `https://${domain}/${relative.replace(/index\.html$/, "")}`
        : `https://${domain}/${relative}`;

  const tags = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="Kinetic Gain">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  ].join("\n  ");

  html = html.replace("</head>", `  ${tags}\n</head>`);
  writeFileSync(file, html);
  count += 1;
}

console.log(`seo-meta: injected OG/Twitter/description into ${count} pages for ${domain}`);
