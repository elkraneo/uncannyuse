import { defineCollection, z } from "astro:content";
import featureData from "./data/features/realitykit-components.json";

const componentIds = [
	...new Set(featureData.features.map((feature) => feature.id)),
];

if (componentIds.length === 0) {
	throw new Error("No component ids available for rcpClaims schema.");
}

const rcpClaims = defineCollection({
	type: "content",
	schema: z.object({
		componentId: z.enum(componentIds as [string, ...string[]]),
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
					note: z.string().optional(),
				}),
			)
			.min(1),
		supersedes: z.array(z.string()).default([]),
		supersededBy: z.string().optional(),
	}),
});

export const collections = {
	"rcp-claims": rcpClaims,
};
