import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js";
const TOKEN_PATTERN = /^[a-f0-9]{32}$/i;

async function htmlFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(target);
    }
  }

  await visit(root);
  return files.sort();
}

export async function injectAnalytics({ root, token }) {
  if (!TOKEN_PATTERN.test(token ?? "")) {
    throw new Error("CLOUDFLARE_WEB_ANALYTICS_TOKEN must be a 32-character hexadecimal site token.");
  }

  const files = await htmlFiles(root);
  if (files.length === 0) throw new Error(`No HTML files found under ${root}`);

  const snippet =
    `<script type="module" src="${BEACON_URL}" ` +
    `data-cf-beacon='{"token":"${token}"}'></script>`;
  const report = { root, htmlFiles: files.length, injected: 0, alreadyPresent: 0 };

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const beaconCount = source.split(BEACON_URL).length - 1;
    if (beaconCount > 1) throw new Error(`Multiple Cloudflare beacons found in ${file}`);
    if (beaconCount === 1) {
      if (!source.includes(`"token":"${token}"`)) {
        throw new Error(`A different Cloudflare token is already present in ${file}`);
      }
      report.alreadyPresent += 1;
      continue;
    }

    const closingBody = /<\/body\s*>/i;
    if (!closingBody.test(source)) throw new Error(`Missing closing body tag in ${file}`);
    const updated = source.replace(closingBody, `  ${snippet}\n</body>`);
    await writeFile(file, updated, "utf8");
    report.injected += 1;
  }

  return report;
}

async function main() {
  const rootFlag = process.argv.indexOf("--root");
  const root = path.resolve(rootFlag >= 0 ? process.argv[rootFlag + 1] : "_site");
  const report = await injectAnalytics({
    root,
    token: process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN,
  });
  console.log(JSON.stringify(report));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
