import fs from "node:fs";
import path from "node:path";

function requiredEnv(name) {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required env: ${name}`);
	return value;
}

function parseIssueSections(body) {
	const sections = new Map();
	const regex = /###\s+(.+?)\n+([\s\S]*?)(?=\n###\s+|$)/g;
	let match;
	while ((match = regex.exec(body)) !== null) {
		const heading = match[1].trim().toLowerCase();
		const value = match[2].trim();
		sections.set(heading, value);
	}
	return sections;
}

function firstSectionValue(sections, keys) {
	for (const key of keys) {
		for (const [heading, value] of sections.entries()) {
			if (heading.includes(key)) return value;
		}
	}
	return "";
}

function slugify(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

function normalizeComponentId(raw, validIds) {
	const candidate = raw.trim().toLowerCase();
	if (validIds.has(candidate)) return candidate;

	const slug = slugify(candidate);
	if (validIds.has(slug)) return slug;
	const withSuffix = slug.endsWith("-component") ? slug : `${slug}-component`;
	if (validIds.has(withSuffix)) return withSuffix;

	throw new Error(
		`Component id "${raw}" is not valid. Provide a value from src/data/features/realitykit-components.json`,
	);
}

function mapConfidence(confidenceText) {
	const text = confidenceText.toLowerCase();
	if (text.includes("strong")) return { confidence: "high", sourceType: "direct-diff", status: "confirmed" };
	if (text.includes("medium")) return { confidence: "medium", sourceType: "inference", status: "confirmed" };
	return { confidence: "low", sourceType: "hypothesis", status: "disputed" };
}

function parseSteps(text) {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.replace(/^\d+[.)]\s*/, "").replace(/^-+\s*/, ""));
	return lines.length > 0 ? lines : ["Documented from submitted issue."];
}

function parseEvidence(text) {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length === 0) {
		return [{ type: "doc", path: "evidence-not-provided", note: "No evidence links were provided in issue form." }];
	}
	return lines.map((line) => ({
		type: "doc",
		path: line.replace(/^-+\s*/, ""),
		note: "Imported from issue form evidence field.",
	}));
}

const issueNumber = requiredEnv("ISSUE_NUMBER");
const issueTitle = requiredEnv("ISSUE_TITLE");
const issueBody = requiredEnv("ISSUE_BODY");
const issueAuthor = requiredEnv("ISSUE_AUTHOR");
const issueDate = requiredEnv("ISSUE_CREATED_AT").slice(0, 10);

const featuresPath = path.resolve("src/data/features/realitykit-components.json");
const featuresData = JSON.parse(fs.readFileSync(featuresPath, "utf8"));
const validIds = new Set(featuresData.features.map((feature) => feature.id));

const sections = parseIssueSections(issueBody);
const rawComponent = firstSectionValue(sections, ["component"]);
const componentId = normalizeComponentId(rawComponent, validIds);
const summary = firstSectionValue(sections, ["short summary"]) || "Summary pending maintainer refinement.";
const observed = firstSectionValue(sections, ["what did you observe"]) || "Observed behavior submitted via issue form.";
const expected = firstSectionValue(sections, ["what did you expect"]);
const axisRaw = firstSectionValue(sections, ["axis"]).toLowerCase();
const axis = axisRaw.includes("runtime")
	? "runtime"
	: axisRaw.includes("general")
		? "general"
		: "rcp";
const scope = firstSectionValue(sections, ["scope"]) || "USDA authored";
const confidenceText = firstSectionValue(sections, ["evidence confidence"]) || "low evidence";
const reproSteps = parseSteps(firstSectionValue(sections, ["reproduction steps"]));
const evidence = parseEvidence(firstSectionValue(sections, ["evidence links or files"]));
const rcpVersion = firstSectionValue(sections, ["rcp version"]) || "unspecified";
const xcodeBuild = firstSectionValue(sections, ["xcode build"]) || "unspecified";

const mapped = mapConfidence(confidenceText);
const claim = issueTitle.replace(/^\[note\]\s*/i, "").trim() || observed.split("\n")[0];
const slugBase = slugify(claim || `issue-${issueNumber}`);

const notesDir = path.resolve("src/content/rcp-claims", componentId);
fs.mkdirSync(notesDir, { recursive: true });

let filename = `${issueDate}-${slugBase}.md`;
let destination = path.join(notesDir, filename);
let suffix = 2;
while (fs.existsSync(destination)) {
	filename = `${issueDate}-${slugBase}-${suffix}.md`;
	destination = path.join(notesDir, filename);
	suffix += 1;
}

const frontmatter = [
	"---",
	`componentId: ${componentId}`,
	`axis: ${axis}`,
	`claim: ${JSON.stringify(claim)}`,
	`summary: ${JSON.stringify(summary)}`,
	`scope: ${JSON.stringify(scope)}`,
	`sourceType: ${mapped.sourceType}`,
	`confidence: ${mapped.confidence}`,
	`status: ${mapped.status}`,
	`author: ${issueAuthor}`,
	`date: ${issueDate}`,
	`rcpVersion: ${JSON.stringify(rcpVersion)}`,
	`xcodeBuild: ${JSON.stringify(xcodeBuild)}`,
	"reproSteps:",
	...reproSteps.map((step) => `  - ${JSON.stringify(step)}`),
	"evidence:",
	...evidence.flatMap((item) => [
		"  - type: doc",
		`    path: ${JSON.stringify(item.path)}`,
		`    note: ${JSON.stringify(item.note)}`,
	]),
	"supersedes: []",
	"---",
	"",
	`Imported from issue #${issueNumber}.`,
	"",
	"## Observed behavior",
	"",
	observed,
];

if (expected) {
	frontmatter.push("", "## Expected behavior", "", expected);
}

fs.writeFileSync(destination, `${frontmatter.join("\n")}\n`, "utf8");
console.log(`Wrote note file: ${path.relative(process.cwd(), destination)}`);
