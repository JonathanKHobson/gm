import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { injectAnalytics } from "./inject-cloudflare-analytics.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";

test("injects one beacon per HTML file and is idempotent", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "analytics-inject-"));
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "index.html"), "<html><body>Home</body></html>");
  await writeFile(path.join(root, "nested", "page.html"), "<html><body>Page</body></html>");

  const first = await injectAnalytics({ root, token: TOKEN });
  assert.deepEqual(
    { htmlFiles: first.htmlFiles, injected: first.injected, alreadyPresent: first.alreadyPresent },
    { htmlFiles: 2, injected: 2, alreadyPresent: 0 },
  );
  const second = await injectAnalytics({ root, token: TOKEN });
  assert.deepEqual(
    { htmlFiles: second.htmlFiles, injected: second.injected, alreadyPresent: second.alreadyPresent },
    { htmlFiles: 2, injected: 0, alreadyPresent: 2 },
  );
  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.equal(html.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g)?.length, 1);
});

test("rejects invalid tokens and malformed HTML", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "analytics-inject-"));
  await writeFile(path.join(root, "index.html"), "<html><body>Missing close");
  await assert.rejects(() => injectAnalytics({ root, token: "invalid" }), /32-character hexadecimal/);
  await assert.rejects(() => injectAnalytics({ root, token: TOKEN }), /Missing closing body tag/);
});
