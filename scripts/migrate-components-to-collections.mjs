/**
 * Migration script: splits realitykit-components.json into individual
 * Astro Content Collection entries under src/content/components/.
 *
 * Run: node scripts/migrate-components-to-collections.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, "..");

const sourcePath = path.join(
	SITE_ROOT,
	"src/data/features/realitykit-components.json",
);
const outputDir = path.join(SITE_ROOT, "src/content/components");

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
const features = raw.features;

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

let written = 0;

for (const feature of features) {
	const { id, name, description, subcategory, era, rcp, support, notes, docsUrl, links } = feature;

	// Build frontmatter — keys sorted for consistency
	const frontmatter = {
		name,
		description,
		subcategory,
		era,
		rcp,
		support,
	};

	// Optional fields — only include if present and non-empty
	if (docsUrl) frontmatter.docsUrl = docsUrl;
	if (notes && notes.length > 0) frontmatter.notes = notes;
	if (links && links.length > 0) frontmatter.links = links;

	// Serialize to YAML-like frontmatter
	const lines = ["---"];
	for (const [key, value] of Object.entries(frontmatter)) {
		lines.push(`${key}: ${serializeYaml(value)}`);
	}
	lines.push("---");
	lines.push(""); // trailing newline

	const outputPath = path.join(outputDir, `${id}.md`);
	fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
	written++;
}

console.log(`Migrated ${written} components to ${outputDir}`);

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
		// Quote strings that could be misinterpreted
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
		if (value.every((v) => typeof v === "string")) {
			// Simple string array — inline flow style
			return `[${value.map((v) => serializeYaml(v)).join(", ")}]`;
		}
		// Complex array — block style
		const items = value.map((v) => `${pad}  - ${serializeYaml(v, indent + 1)}`);
		return `\n${items.join("\n")}`;
	}

	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) return "{}";
		// Object — block style
		const props = entries.map(
			([k, v]) => `${pad}  ${k}: ${serializeYaml(v, indent + 1)}`,
		);
		return `\n${props.join("\n")}`;
	}

	return String(value);
}
