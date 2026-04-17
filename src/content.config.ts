import { defineCollection, z } from "astro:content";

// ── Shared enums ──────────────────────────────────
// These enforce consistency across all collections.
// Adding a new subcategory, era, or status requires updating these lists.

const subcategory = z.enum([
	"rendering",
	"lighting",
	"audio",
	"physics",
	"spatial",
	"interaction",
	"camera",
	"animation",
	"media",
	"custom",
]);

const era = z.enum([
	"Original",
	"visionOS 1",
	"visionOS 2",
	"26.0",
	"iOS 15",
	"iOS 17",
]);

const supportStatus = z.enum(["y", "n", "p", "h"]);

const platformSupport = z.object({
	status: supportStatus,
	since: z.string().optional(),
	note: z.string().optional(),
});

// ── Components collection ─────────────────────────
// Each file in src/content/components/{id}.md is one RealityKit component.
// The filename (slug) is the canonical id — e.g. "model-component.md" → id "model-component".

const components = defineCollection({
	type: "content",
	schema: z.object({
		name: z.string().min(1),
		description: z.string().min(1),
		subcategory,
		era,
		rcp: z.boolean(),
		support: z.object({
			ios: platformSupport,
			visionos: platformSupport,
			macos: platformSupport,
		}),
		docsUrl: z.string().url().optional(),
		notes: z.array(z.string()).optional(),
		links: z.array(z.object({ text: z.string(), url: z.string().url() })).optional(),
	}),
});

// ── RCP Claims collection ─────────────────────────
// Valid componentIds are derived from the components collection slugs at build time.
// The "custom-component-types" virtual id is included for the special ECS page.

// We read component slugs directly from the filesystem so the config stays
// independent of Astro's generated content types.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.join(__dirname, "content/components");

let componentIds: string[] = ["custom-component-types"];
try {
	const files = fs.readdirSync(componentsDir);
	componentIds = [
		...files
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, "")),
		"custom-component-types",
	];
} catch {
	// Directory may not exist yet during initial setup
}

if (componentIds.length <= 1) {
	throw new Error(
		"No component entries found in src/content/components/. Run the migration script first.",
	);
}

// ── Resources collection ──────────────────────────
// Each file in src/content/resources/{componentId}.md holds curated
// external resources (docs, videos, articles) for one component.
// The componentId must match a slug in the components collection.

const resources = defineCollection({
	type: "content",
	schema: z.object({
		componentId: z.enum(componentIds as [string, ...string[]]),
		resources: z.array(
			z.object({
				title: z.string().min(1),
				url: z.string().url(),
				type: z.enum(["official-docs", "wwdc-session", "article", "tutorial", "sample-code", "video", "other"]),
				source: z.string().min(1),
				verifiedAt: z.union([z.string(), z.date()]).optional(),
				description: z.string().optional(),
				image: z.string().optional(),
			}),
		).min(1),
	}),
});

const rcpClaims = defineCollection({
	type: "content",
	schema: z.object({
		componentId: z.enum(componentIds as [string, ...string[]]),
		axis: z.enum(["rcp", "runtime", "general"]),
		claim: z.string().min(10),
		summary: z.string().min(20),
		scope: z.enum(["RCP UI", "USDA authored", "runtime behavior"]),
		sourceType: z.enum(["direct-diff", "inference", "hypothesis"]),
		confidence: z.enum(["low", "medium", "high"]),
		status: z.enum(["confirmed", "disputed", "superseded"]),
		author: z.string().min(1),
		date: z.coerce.date(),
		rcpVersion: z.string().min(1),
		xcodeBuild: z.string().min(1),
		reproSteps: z.array(z.string().min(1)).min(1),
		evidence: z
			.array(
				z.object({
					type: z.enum(["fixture", "diff", "screenshot", "log", "doc"]),
					path: z.string().min(1),
					artifactLabel: z.string().optional(),
					publicUrl: z.string().url().optional(),
					note: z.string().optional(),
				}),
			)
			.min(1),
		supersedes: z.array(z.string()).default([]),
		supersededBy: z.string().optional(),
	}),
});

export const collections = {
	components,
	resources,
	"rcp-claims": rcpClaims,
};
