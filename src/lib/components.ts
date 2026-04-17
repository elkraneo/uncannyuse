/**
 * Shared helpers for working with the components content collection.
 *
 * The component slug (filename without .md) is the canonical id.
 * This module maps content collection entries to the Feature shape
 * used by page templates.
 */
import { getCollection } from "astro:content";
import type { Feature, PlatformSupport } from "./types";

export async function getAllFeatures(): Promise<Feature[]> {
	const entries = await getCollection("components");
	return entries.map((entry) => ({
		id: entry.slug,
		name: entry.data.name,
		description: entry.data.description,
		subcategory: entry.data.subcategory,
		era: entry.data.era,
		rcp: entry.data.rcp,
		support: entry.data.support as Record<string, PlatformSupport> as Feature["support"],
		docsUrl: entry.data.docsUrl,
		notes: entry.data.notes,
		links: entry.data.links,
	}));
}
