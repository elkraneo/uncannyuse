import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = "/Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com";
const FIXTURES_ROOT =
  "/Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets";
const FEATURES_JSON = path.join(SITE_ROOT, "src/data/features/realitykit-components.json");
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

    const changedCount = Object.entries(row.values).filter(([name, value]) => value !== fieldMap.get(name).base).length;
    row.note = changedCount === 0 ? "Baseline or equivalent state" : `${changedCount} field change${changedCount > 1 ? "s" : ""}`;
    matrix.push(row);
  }

  const fields = Array.from(fieldMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((field) => ({
      name: field.name,
      type: field.type,
      base: field.base,
      variants: field.variants.size > 0 ? Array.from(field.variants).slice(0, 3).join(", ") : field.base,
      notes: field.base === "omitted" ? "Not authored in baseline fixture." : "",
    }));

  const variantExamples = matrix.filter((row) => row.variant !== path.relative(folderPath, baselineFile)).slice(0, 2);
  const sparseBlocks = variantExamples
    .map((row) => {
      const full = path.join(folderPath, row.variant);
      const parsed = parsedByFile.get(full);
      return parsed ? `# ${row.variant}\n${parsed.block}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  const fullMatrix = matrix.map((row) => ({
    variant: row.variant,
    note: row.note,
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
    baseline: path.relative(folderPath, baselineFile),
    introducedBlock: baselineParsed.block,
    sparseExamples: sparseBlocks || "# Variant patch examples not available yet.",
    fields,
    matrix: fullMatrix,
    sourceFolder: toRelativeFixturePath(folderPath),
  };
}

function main() {
  const featuresData = readJson(FEATURES_JSON);
  const features = featuresData.features ?? [];

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
