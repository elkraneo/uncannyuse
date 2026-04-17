/**
 * Migration script: splits realitykit-resources.json into individual
 * Astro Content Collection entries under src/content/resources/.
 *
 * Each component gets its own {component-id}.md with a resources array
 * in frontmatter. The componentId references the components collection.
 *
 * Run: node scripts/migrate-resources-to-collections.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, "..");

const sourcePath = path.join(
	SITE_ROOT,
	"src/data/resources/realitykit-resources.json",
);
const outputDir = path.join(SITE_ROOT, "src/content/resources");

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
const resourcesById = raw.resources;

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

let written = 0;
let skipped = 0;

for (const [componentId, resources] of Object.entries(resourcesById)) {
	if (!resources || resources.length === 0) {
		skipped++;
		continue;
	}

	const frontmatter = {
		componentId,
		resources,
	};

	const lines = ["---"];
	for (const [key, value] of Object.entries(frontmatter)) {
		lines.push(`${key}: ${serializeYaml(value)}`);
	}
	lines.push("---");
	lines.push("");

	const outputPath = path.join(outputDir, `${componentId}.md`);
	fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
	written++;
}

console.log(`Migrated ${written} resource entries to ${outputDir}`);
if (skipped > 0) console.log(`Skipped ${skipped} empty entries`);

/**
 * Simple YAML serializer — handles strings, booleans, numbers, arrays, and objects.
 * Not a full YAML emitter, but sufficient for this structured data.
 */
function serializeYaml(value, indent = 0) {
	const pad = "  ".repeat(indent);

	if (value === null || value === undefined) {
		return "null";
	}

	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}

	if (typeof value === "number") {
		return String(value);
	}

	if (typeof value === "string") {
		if (
			value === "" ||
			value === "true" ||
			value === "false" ||
			value === "null" ||
			/^\d+(\.\d+)?$/.test(value) ||
			value.includes(":") ||
			value.includes("#") ||
			value.includes("'") ||
			value.includes('"') ||
			value.includes("\n") ||
			value.startsWith(" ") ||
			value.startsWith("-") ||
			value.startsWith("[") ||
			value.startsWith("{") ||
			value.startsWith("&") ||
			value.startsWith("*") ||
			value.startsWith("!") ||
			value.startsWith("|") ||
			value.startsWith(">") ||
			value.startsWith("%") ||
			value.startsWith("@") ||
			value.startsWith("`") ||
			value.startsWith(",")
		) {
			return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
		}
		return value;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) return "[]";
		// Array of objects — block style with each item as an object
		const items = value.map((v) => {
			if (typeof v === "object" && v !== null) {
				const entries = Object.entries(v);
				const props = entries.map(
					([k, val]) => `${pad}    ${k}: ${serializeYaml(val, indent + 2)}`,
				);
				return `${pad}  - \n${props.join("\n")}`;
			}
			return `${pad}  - ${serializeYaml(v, indent + 1)}`;
		});
		return `\n${items.join("\n")}`;
	}

	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) return "{}";
		const props = entries.map(
			([k, v]) => `${pad}  ${k}: ${serializeYaml(v, indent + 1)}`,
		);
		return `\n${props.join("\n")}`;
	}

	return String(value);
}
