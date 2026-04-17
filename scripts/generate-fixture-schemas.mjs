import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = "/Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com";
const FIXTURES_ROOT =
  "/Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets";
const FEATURES_DIR = path.join(SITE_ROOT, "src/content/components");
const OUT_JSON = path.join(SITE_ROOT, "src/data/schemas/fixture-schemas.json");

const aliasByFolder = new Map([
  ["Model Sorting", "model-sort-group-component"],
  ["Opacity", "opacity-component"],
]);

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function simplifyFeatureName(name) {
  return name.replace(/Component$/i, "").replace(/State$/i, "");
}

function readFeaturesFromCollection(dir) {
  const features = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    // Simple YAML frontmatter parse for our flat schema
    const yaml = match[1];
    const data = {};
    let currentKey = null;
    let currentObj = null;
    let inSupport = false;
    let platformKey = null;
    for (const line of yaml.split("\n")) {
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      if (indent === 0 && trimmed.includes(":")) {
        const [key, ...rest] = trimmed.split(":");
        const val = rest.join(":").trim();
        if (key === "support") {
          inSupport = true;
          data.support = {};
          currentObj = data.support;
        } else {
          inSupport = false;
          if (val) {
            try { data[key] = JSON.parse(val); } catch { data[key] = val; }
          }
          currentKey = key;
        }
      } else if (inSupport && indent === 2 && trimmed.includes(":")) {
        const [key, ...rest] = trimmed.split(":");
        const val = rest.join(":").trim();
        if (["ios", "visionos", "macos"].includes(key)) {
          platformKey = key;
          data.support[platformKey] = {};
          currentObj = data.support[platformKey];
          if (val) {
            try { currentObj.status = JSON.parse(val); } catch { /* object follows */ }
          }
        }
      } else if (inSupport && indent === 4 && trimmed.includes(":") && currentObj) {
        const [key, ...rest] = trimmed.split(":");
        const val = rest.join(":").trim();
        try { currentObj[key] = JSON.parse(val); } catch { currentObj[key] = val; }
      }
    }
    features.push({ id: file.replace(/\.md$/, ""), ...data });
  }
  return features;
}

function dedentBlock(value) {
  const lines = value.replace(/\t/g, "  ").split("\n");
  if (lines.length === 0) return value.trim();

  const headerIndent = lines[0].match(/^ */)?.[0]?.length ?? 0;
  let normalized = lines.map((line) => line.slice(Math.min(headerIndent, line.length)));

  if (normalized.length > 1) {
    const bodyNonEmpty = normalized.slice(1).filter((line) => line.trim().length > 0);
    if (bodyNonEmpty.length > 0) {
      const bodyIndent = Math.min(
        ...bodyNonEmpty.map((line) => line.match(/^ */)?.[0]?.length ?? 0),
      );
      normalized = [
        normalized[0],
        ...normalized.slice(1).map((line) => line.slice(Math.min(bodyIndent, line.length))),
      ];
    }
  }

  return normalized.join("\n").trimEnd();
}

function extractBalancedBlock(source, openBraceIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openBraceIndex; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex, i + 1);
      }
    }
  }

  return null;
}

function walkUsdFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && full.toLowerCase().endsWith(".usda")) {
        files.push(full);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function findRealityKitComponentBlock(content) {
  const pattern = /def\s+RealityKitComponent\s+"([^"]+)"\s*\{/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const primName = match[1];
    const openBraceIndex = match.index + match[0].lastIndexOf("{");
    const fullBlock = extractBalancedBlock(content, openBraceIndex);
    if (!fullBlock) continue;
    const blockStart = match.index;
    const rawBlock = content.slice(blockStart, openBraceIndex) + fullBlock;
    const block = dedentBlock(rawBlock);
    const body = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
    const idMatch = body.match(/uniform\s+token\s+info:id\s*=\s*"([^"]+)"/);
    if (!idMatch) continue;

    const fields = [];
    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("uniform token info:id")) continue;
      const fieldMatch = trimmed.match(/^([A-Za-z0-9:_\[\]]+)\s+([A-Za-z0-9:_]+)\s*=\s*(.+)$/);
      if (!fieldMatch) continue;
      const [, type, name, value] = fieldMatch;
      fields.push({ type, name, value: value.trim() });
    }

    return {
      primName,
      componentId: idMatch[1],
      block,
      fields,
    };
  }
  return null;
}

function pickBaselineFile(files) {
  const byName = files.find((file) => path.basename(file).toLowerCase() === "base.usda");
  if (byName) return byName;

  const byAll = files.find((file) => ["all.usda", "base.usda"].includes(path.basename(file).toLowerCase()));
  if (byAll) return byAll;

  return files[0] ?? null;
}

function toRelativeFixturePath(filePath) {
  return filePath.replace("/Volumes/Plutonian/_Developer/Deconstructed/source/", "");
}

function topLevelVariantSection(relativePath) {
  const [first] = relativePath.split("/");
  return first ?? "";
}

function summarizeChangedFields(changedFields) {
  if (changedFields.length === 0) return "No authored delta from baseline";
  if (changedFields.length <= 3) return `Changes: ${changedFields.join(", ")}`;
  return `Changes: ${changedFields.slice(0, 3).join(", ")} + ${changedFields.length - 3} more`;
}

function selectSparseExampleRows(matrix, baselineVariant) {
  const changedRows = matrix.filter((row) => row.variant !== baselineVariant && row.changedFields.length > 0);
  if (changedRows.length === 0) return [];

  const bySection = new Map();
  for (const row of changedRows) {
    const section = topLevelVariantSection(row.variant);
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(row);
  }

  const selected = [];

  for (const sectionRows of bySection.values()) {
    sectionRows.sort((lhs, rhs) => {
      if (lhs.changedFields.length !== rhs.changedFields.length) {
        return lhs.changedFields.length - rhs.changedFields.length;
      }
      return lhs.variant.localeCompare(rhs.variant);
    });
    selected.push(sectionRows[0]);
  }

  selected.sort((lhs, rhs) => {
    if (lhs.changedFields.length !== rhs.changedFields.length) {
      return lhs.changedFields.length - rhs.changedFields.length;
    }
    return lhs.variant.localeCompare(rhs.variant);
  });

  return selected.slice(0, 6);
}

function resolveFeatureIdForFolder(folderName, features) {
  if (aliasByFolder.has(folderName)) return aliasByFolder.get(folderName);

  const normalizedFolder = normalize(folderName);
  const match = features.find((feature) => {
    const raw = normalize(feature.name ?? "");
    const simplified = normalize(simplifyFeatureName(feature.name ?? ""));
    return raw === normalizedFolder || simplified === normalizedFolder;
  });

  return match?.id;
}

function buildDraftForFolder(folderPath, feature) {
  if (feature.id === "audio-mix-groups-component") {
    return {
      slug: feature.id,
      componentName: feature.name,
      componentId: "RealityKit.AudioMixGroups",
      primSignature: 'def RealityKitComponent "AudioMixGroups"',
      coverage: "Observed",
      risk: "Medium",
      baseline: "BASE.usda",
      introducedBlock:
        'def RealityKitComponent "AudioMixGroups"\n{\n    uniform token info:id = "RealityKit.AudioMixGroups"\n}',
      sparseExamples:
        '# AddMixGroup.usda\n' +
        'def RealityKitComponent "AudioMixGroups"\n' +
        '{\n' +
        '    uniform token info:id = "RealityKit.AudioMixGroups"\n' +
        '\n' +
        '    def RealityKitAudioMixGroup "MixGroup"\n' +
        '    {\n' +
        '        float gain = 0\n' +
        '        bool mute = 0\n' +
        '        float speed = 1\n' +
        '    }\n' +
        '}\n\n' +
        '# AssignSingleAudio.usda\n' +
        'def RealityKitAudioFile "_1bells_wav"\n' +
        '{\n' +
        '    uniform asset file = @../1bells.wav@\n' +
        '    rel mixGroup = </Root/Cube/AudioMixGroups/MixGroup>\n' +
        '    uniform bool shouldLoop = 0\n' +
        '}',
      fields: [
        {
          name: "MixGroup.gain",
          type: "float",
          base: "omitted",
          variants: "0, -15.505303",
          notes: "Authored on child RealityKitAudioMixGroup prims after a mix group exists.",
        },
        {
          name: "MixGroup.mute",
          type: "bool",
          base: "omitted",
          variants: "0, 1",
          notes: "Authored on child RealityKitAudioMixGroup prims after a mix group exists.",
        },
        {
          name: "MixGroup.speed",
          type: "float",
          base: "omitted",
          variants: "1, 2.4326851",
          notes: "Authored on child RealityKitAudioMixGroup prims after a mix group exists.",
        },
        {
          name: "AudioFile.file",
          type: "asset",
          base: "omitted",
          variants: "@../1bells.wav@, @../MUI POP UP Bubbly.wav@",
          notes: "Authored on external RealityKitAudioFile prims, not on the component prim.",
        },
        {
          name: "AudioFile.mixGroup",
          type: "rel",
          base: "omitted",
          variants:
            "</Root/Cube/AudioMixGroups/MixGroup>, </Root/Cube/AudioMixGroups/MixGroup_2>",
          notes: "Routes external audio-file prims to a specific mix-group child prim.",
        },
      ],
      matrix: [
        {
          variant: "BASE.usda",
          values: {
            "MixGroup.gain": "omitted",
            "MixGroup.mute": "omitted",
            "MixGroup.speed": "omitted",
            "AudioFile.file": "omitted",
            "AudioFile.mixGroup": "omitted",
          },
          note: "Inspector launcher only; no mix groups or routed files authored yet",
        },
        {
          variant: "AddMixGroup.usda",
          values: {
            "MixGroup.gain": "0",
            "MixGroup.mute": "0",
            "MixGroup.speed": "1",
            "AudioFile.file": "omitted",
            "AudioFile.mixGroup": "omitted",
          },
          note: "Adds first RealityKitAudioMixGroup child with default gain, mute, and speed",
        },
        {
          variant: "AssignSingleAudio.usda",
          values: {
            "MixGroup.gain": "0",
            "MixGroup.mute": "0",
            "MixGroup.speed": "1",
            "AudioFile.file": "@../1bells.wav@",
            "AudioFile.mixGroup": "</Root/Cube/AudioMixGroups/MixGroup>",
          },
          note: "Creates one external RealityKitAudioFile prim and routes it to MixGroup",
        },
        {
          variant: "AssignSecondAudioSameGroup.usda",
          values: {
            "MixGroup.gain": "0",
            "MixGroup.mute": "0",
            "MixGroup.speed": "1",
            "AudioFile.file": "@../1bells.wav@ + @../MUI POP UP Bubbly.wav@",
            "AudioFile.mixGroup": "</Root/Cube/AudioMixGroups/MixGroup>",
          },
          note: "Two external audio files can route to the same mix group",
        },
        {
          variant: "CreateSecondGroupAndAssign.usda",
          values: {
            "MixGroup.gain": "0 + 0",
            "MixGroup.mute": "0 + 0",
            "MixGroup.speed": "1 + 1",
            "AudioFile.file": "@../1bells.wav@ + @../MUI POP UP Bubbly.wav@",
            "AudioFile.mixGroup":
              "</Root/Cube/AudioMixGroups/MixGroup> + </Root/Cube/AudioMixGroups/MixGroup_2>",
          },
          note: "Adds a second mix-group child and routes one audio file to each group",
        },
        {
          variant: "Gain.usda",
          values: {
            "MixGroup.gain": "-15.505303",
            "MixGroup.mute": "0",
            "MixGroup.speed": "1",
            "AudioFile.file": "@../1bells.wav@",
            "AudioFile.mixGroup": "</Root/Cube/AudioMixGroups/MixGroup>",
          },
          note: "Group-level gain changes on the child mix-group prim, not on the component prim",
        },
        {
          variant: "Mute.usda",
          values: {
            "MixGroup.gain": "0",
            "MixGroup.mute": "1",
            "MixGroup.speed": "1",
            "AudioFile.file": "@../1bells.wav@",
            "AudioFile.mixGroup": "</Root/Cube/AudioMixGroups/MixGroup>",
          },
          note: "Mute is a group-level child-prim field",
        },
        {
          variant: "Speed.usda",
          values: {
            "MixGroup.gain": "0",
            "MixGroup.mute": "0",
            "MixGroup.speed": "2.4326851",
            "AudioFile.file": "@../1bells.wav@",
            "AudioFile.mixGroup": "</Root/Cube/AudioMixGroups/MixGroup>",
          },
          note: "Speed is a group-level child-prim field",
        },
      ],
      sourceFolder: toRelativeFixturePath(folderPath),
    };
  }

  const files = walkUsdFiles(folderPath);
  if (files.length === 0) return null;

  const baselineFile = pickBaselineFile(files);
  if (!baselineFile) return null;

  const parsedByFile = new Map();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const parsed = findRealityKitComponentBlock(content);
    if (parsed) parsedByFile.set(file, parsed);
  }

  const baselineParsed = parsedByFile.get(baselineFile) ?? parsedByFile.values().next().value;
  if (!baselineParsed) return null;

  const compatibleFiles = files.filter((file) => {
    const parsed = parsedByFile.get(file);
    return parsed && parsed.componentId === baselineParsed.componentId;
  });

  const fieldMap = new Map();
  for (const file of compatibleFiles) {
    const parsed = parsedByFile.get(file);
    for (const field of parsed.fields) {
      if (!fieldMap.has(field.name)) {
        fieldMap.set(field.name, {
          name: field.name,
          type: field.type,
          base: "omitted",
          variants: new Set(),
          notes: "",
        });
      }
    }
  }

  const baselineFields = new Map(baselineParsed.fields.map((field) => [field.name, field]));
  for (const [name, info] of fieldMap.entries()) {
    const baseField = baselineFields.get(name);
    info.base = baseField ? baseField.value : "omitted";
  }

  const matrix = [];
  for (const file of compatibleFiles) {
    const parsed = parsedByFile.get(file);
    const row = { variant: path.relative(folderPath, file), values: {}, note: "" };
    const fieldsByName = new Map(parsed.fields.map((field) => [field.name, field]));

    for (const [name, info] of fieldMap.entries()) {
      const field = fieldsByName.get(name);
      row.values[name] = field ? field.value : "omitted";
      if (field && field.value !== info.base) info.variants.add(field.value);
    }

    const changedFields = Object.entries(row.values)
      .filter(([name, value]) => value !== fieldMap.get(name).base)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));

    row.changedFields = changedFields;
    row.note =
      changedFields.length === 0
        ? row.variant === path.relative(folderPath, baselineFile)
          ? "Canonical baseline fixture"
          : "Equivalent to baseline; empty scaffold only"
        : summarizeChangedFields(changedFields);
    matrix.push(row);
  }

  const fields = Array.from(fieldMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((field) => ({
      name: field.name,
      type: field.type,
      base: field.base,
      variants: field.variants.size > 0 ? Array.from(field.variants).slice(0, 3).join(", ") : field.base,
      notes: field.base === "omitted" ? "Sparse only; not authored in the baseline fixture." : "",
    }));

  const baselineVariant = path.relative(folderPath, baselineFile);
  const sparseExampleRows = selectSparseExampleRows(matrix, baselineVariant).map((row) => {
    const full = path.join(folderPath, row.variant);
    const parsed = parsedByFile.get(full);
    return parsed
      ? {
          variant: row.variant,
          note: row.note,
          changedFields: row.changedFields,
          block: parsed.block,
        }
      : null;
  }).filter(Boolean);

  const sparseBlocks = sparseExampleRows
    .map((row) => {
      return `# ${row.variant}\n# ${row.note}\n${row.block}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const fullMatrix = matrix.map((row) => ({
    variant: row.variant,
    note: row.note,
    changedFields: row.changedFields,
    values: row.values,
  }));

  const coverage = compatibleFiles.length >= 2 ? "Observed" : "Partial";

  return {
    slug: feature.id,
    componentName: feature.name,
    componentId: baselineParsed.componentId,
    primSignature: `def RealityKitComponent "${baselineParsed.primName}"`,
    coverage,
    risk: fields.length <= 4 ? "Low" : fields.length <= 8 ? "Medium" : "High",
    baseline: baselineVariant,
    introducedBlock: baselineParsed.block,
    sparseExamples: sparseBlocks || "# Variant patch examples not available yet.",
    sparseExampleRows,
    fields,
    matrix: fullMatrix,
    sourceFolder: toRelativeFixturePath(folderPath),
  };
}

function main() {
  const features = readFeaturesFromCollection(FEATURES_DIR);

  const folders = fs
    .readdirSync(FIXTURES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== "textures");

  const bySlug = {};
  const unmatchedFolders = [];

  for (const folderName of folders) {
    const featureId = resolveFeatureIdForFolder(folderName, features);
    if (!featureId) {
      unmatchedFolders.push(folderName);
      continue;
    }

    const feature = features.find((item) => item.id === featureId);
    if (!feature) continue;

    const folderPath = path.join(FIXTURES_ROOT, folderName);
    const draft = buildDraftForFolder(folderPath, feature);
    if (draft) {
      bySlug[featureId] = draft;
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    bySlug,
    unmatchedFolders,
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Generated ${Object.keys(bySlug).length} schema drafts to ${OUT_JSON}`);
  if (unmatchedFolders.length > 0) {
    console.log(`Unmatched fixture folders: ${unmatchedFolders.join(", ")}`);
  }
}

main();
