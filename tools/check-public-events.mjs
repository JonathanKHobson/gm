import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const offline = args.includes("--offline");
const reportIndex = args.indexOf("--report");
const nowIndex = args.indexOf("--now");
const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : "";
const now = nowIndex >= 0 ? new Date(args[nowIndex + 1]) : new Date();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "scripts", "public-events.js");
const issues = [];

function addIssue(level, code, message) {
  issues.push({ level, code, message });
}

function normalizeText(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function registryDateKey(start) {
  const match = String(start).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : "";
}

function discoverDateKeys(html) {
  const months = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12"
  };
  const pattern = /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\s+at\s+(\d{1,2}):(\d{2})\s+(a\.m\.|p\.m\.)/gi;
  const found = new Map();
  let match;

  while ((match = pattern.exec(html)) !== null) {
    let hour = Number(match[5]);
    const period = match[7].toLowerCase();
    if (period === "p.m." && hour !== 12) hour += 12;
    if (period === "a.m." && hour === 12) hour = 0;
    const key = `${match[4]}-${months[match[2].toLowerCase()]}-${String(match[3]).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${match[6]}`;
    found.set(key, match[0]);
  }

  return found;
}

function loadRegistry() {
  const source = fs.readFileSync(registryPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: registryPath });
  return sandbox.window.GameMasterKyle || {};
}

const registry = loadRegistry();
const events = Array.isArray(registry.publicEvents) ? registry.publicEvents : [];
const sources = Array.isArray(registry.publicEventSources) ? registry.publicEventSources : [];
const requiredFields = ["id", "game", "title", "name", "time", "venue", "start", "url", "detailsUrl", "sourceId"];
const seenIds = new Set();
const sourceById = new Map(sources.map((source) => [source.id, source]));

if (!events.length) addIssue("error", "NO_EVENTS", "The public event registry is empty.");
if (!sources.length) addIssue("error", "NO_SOURCES", "The public event source list is empty.");

for (const event of events) {
  for (const field of requiredFields) {
    if (!event[field]) addIssue("error", "MISSING_FIELD", `${event.id || "Unnamed event"} is missing ${field}.`);
  }
  if (seenIds.has(event.id)) addIssue("error", "DUPLICATE_ID", `Duplicate event id: ${event.id}.`);
  seenIds.add(event.id);
  if (!Number.isFinite(Date.parse(event.start))) addIssue("error", "INVALID_START", `${event.id} has an invalid start time.`);
  if (!sourceById.has(event.sourceId)) addIssue("error", "UNKNOWN_SOURCE", `${event.id} references unknown source ${event.sourceId}.`);
  if (!/^https:\/\//.test(event.url || "")) addIssue("error", "INVALID_URL", `${event.id} must use an HTTPS booking URL.`);
}

const sortedStarts = events.map((event) => Date.parse(event.start));
for (let index = 1; index < sortedStarts.length; index += 1) {
  if (sortedStarts[index] < sortedStarts[index - 1]) {
    addIssue("warning", "UNSORTED_EVENTS", "Public events are not stored in chronological order.");
    break;
  }
}

const upcoming = events
  .filter((event) => Date.parse(event.start) > now.getTime())
  .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

if (!upcoming.length) {
  addIssue("error", "NO_UPCOMING_EVENTS", "No future public event is registered. The next-game banner will be hidden.");
}

const remoteChecks = [];
if (!offline) {
  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { "user-agent": "GameMasterKyle public event registry watcher" },
        signal: AbortSignal.timeout(20000)
      });
      const html = await response.text();
      const normalized = normalizeText(html);
      remoteChecks.push({ sourceId: source.id, status: response.status, ok: response.ok });

      if (!response.ok) {
        addIssue("error", "SOURCE_UNAVAILABLE", `${source.name} returned HTTP ${response.status}.`);
        continue;
      }

      for (const event of upcoming.filter((candidate) => candidate.sourceId === source.id && candidate.watchText)) {
        if (!normalized.includes(normalizeText(event.watchText))) {
          addIssue("error", "EVENT_TEXT_MISSING", `${event.id} is no longer listed as expected on ${source.name}.`);
        }
      }

      if (source.discoverDates) {
        const discovered = discoverDateKeys(normalized);
        const registered = new Set(events
          .filter((event) => event.sourceId === source.id)
          .map((event) => registryDateKey(event.start)));

        for (const [key, label] of discovered) {
          const timestamp = Date.parse(`${key}:00-07:00`);
          if (timestamp > now.getTime() && !registered.has(key)) {
            addIssue("error", "UNREGISTERED_REMOTE_DATE", `${source.name} lists an unregistered date: ${label}.`);
          }
        }
      }
    } catch (error) {
      addIssue("error", "SOURCE_CHECK_FAILED", `${source.name} could not be checked: ${error.message}`);
    }
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  effectiveNow: now.toISOString(),
  offline,
  registryPath: path.relative(root, registryPath),
  sourceCount: sources.length,
  eventCount: events.length,
  upcomingCount: upcoming.length,
  nextEvent: upcoming[0] ? {
    id: upcoming[0].id,
    title: upcoming[0].title,
    start: upcoming[0].start
  } : null,
  remoteChecks,
  issues,
  status: issues.some((issue) => issue.level === "error") ? "error" : "ok"
};

if (reportPath) {
  fs.writeFileSync(path.resolve(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "ok" ? 0 : 1);
