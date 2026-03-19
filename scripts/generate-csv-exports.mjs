import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = "/Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com";
const DECONSTRUCTED_SOURCE_ROOT = "/Volumes/Plutonian/_Developer/Deconstructed/source";
const SCHEMA_JSON = path.join(SITE_ROOT, "src/data/schemas/fixture-schemas.json");
const OUT_DIR = path.join(SITE_ROOT, "public/data/schemas");
const API_OUT_DIR = path.join(SITE_ROOT, "public/api");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map((value) => escapeCsv(value)).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function componentApiDir(slug) {
  return path.join(API_OUT_DIR, "components", slug);
}

function splitUiPath(relativeFixturePath) {
  const parts = relativeFixturePath.split("/");
  if (parts.length <= 1) {
    return {
      uiSection: "",
      uiSubsection: "",
      uiLabel: parts[0]?.replace(/\.usda$/i, "") ?? "",
    };
  }

  return {
    uiSection: parts[0],
    uiSubsection: parts.slice(1, -1).join(" / "),
    uiLabel: parts[parts.length - 1].replace(/\.usda$/i, ""),
  };
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

function parseFixtureRows(component) {
  if (!component.sourceFolder) return [];

  const fixtureDir = path.join(DECONSTRUCTED_SOURCE_ROOT, component.sourceFolder);
  if (!fs.existsSync(fixtureDir)) return [];

  const fixturePaths = walkUsdFiles(fixtureDir);
  const primNameMatch = component.primSignature?.match(/"([^"]+)"/);
  const targetPrimName = primNameMatch?.[1] ?? null;
  const rows = [];

  const assignmentPattern =
    /^\s*([A-Za-z0-9_:[\]]+)\s+([A-Za-z0-9_:]+)\s*=\s*(.+?)\s*$/;
  const defPattern = /^\s*def\s+[A-Za-z0-9_]+\s+"([^"]+)"/;

  for (const fixturePath of fixturePaths) {
    const relativeFixturePath = path.relative(fixtureDir, fixturePath).replaceAll(path.sep, "/");
    const { uiSection, uiSubsection, uiLabel } = splitUiPath(relativeFixturePath);
    const lines = fs.readFileSync(fixturePath, "utf8").split(/\r?\n/);

    const stack = [];
    let insideTargetComponent = false;

    for (const line of lines) {
      const defMatch = line.match(defPattern);
      if (defMatch) {
        const name = defMatch[1];
        stack.push(name);
        if (targetPrimName && name === targetPrimName && stack.includes(targetPrimName)) {
          insideTargetComponent = true;
        }
        continue;
      }

      if (line.trim() === "}") {
        const popped = stack.pop();
        if (targetPrimName && popped === targetPrimName) {
          insideTargetComponent = false;
        }
        continue;
      }

      if (!insideTargetComponent) continue;

      const assignmentMatch = line.match(assignmentPattern);
      if (!assignmentMatch) continue;

      const [, usdType, fieldName, authoredValue] = assignmentMatch;
      if (fieldName === "info:id") continue;

      let structScope = "component";
      if (stack.includes("spawnedEmitter")) {
        structScope = "spawnedEmitter";
      } else if (stack.includes("mainEmitter")) {
        structScope = "mainEmitter";
      } else if (stack.includes("currentState")) {
        structScope = "currentState";
      }

      const componentStartIndex = targetPrimName ? stack.indexOf(targetPrimName) : -1;
      const scopedStack =
        componentStartIndex >= 0 ? stack.slice(componentStartIndex) : stack.slice();

      rows.push({
        componentSlug: component.slug,
        componentName: component.componentName,
        componentId: component.componentId,
        fixturePath: relativeFixturePath,
        fixtureName: path.basename(relativeFixturePath, ".usda"),
        uiSection,
        uiSubsection,
        uiLabel,
        structScope,
        fieldName,
        usdType,
        authoredValue,
        componentPath: [...scopedStack, fieldName].join("."),
      });
    }
  }

  return rows;
}

function generateFieldsRows(data) {
  const rows = [];

  for (const [slug, component] of Object.entries(data.bySlug)) {
    if (!component.fields) continue;
    for (const field of component.fields) {
      rows.push([
        slug,
        component.componentName,
        component.componentId,
        field.name,
        field.type,
        field.base,
        field.variants,
        field.notes,
        component.risk,
        component.coverage,
      ]);
    }
  }

  return rows;
}

function generateMatrixRows(data) {
  const rows = [];

  for (const [slug, component] of Object.entries(data.bySlug)) {
    if (!component.matrix) continue;
    for (const matrixEntry of component.matrix) {
      for (const [fieldName, fieldValue] of Object.entries(matrixEntry.values)) {
        rows.push([
          slug,
          component.componentName,
          component.componentId,
          matrixEntry.variant,
          matrixEntry.note,
          fieldName,
          fieldValue,
        ]);
      }
    }
  }

  return rows;
}

function writePerComponentArtifacts(data) {
  const componentsIndex = [];

  for (const [slug, component] of Object.entries(data.bySlug)) {
    const dir = componentApiDir(slug);
    ensureDir(dir);

    const schemaPath = path.join(dir, "schema.json");
    fs.writeFileSync(schemaPath, `${JSON.stringify(component, null, 2)}\n`, "utf8");

    const fieldHeaders = [
      "componentSlug",
      "componentName",
      "componentId",
      "fieldName",
      "fieldType",
      "baseValue",
      "variants",
      "notes",
      "risk",
      "coverage",
    ];
    const fieldRows = (component.fields ?? []).map((field) => [
      slug,
      component.componentName,
      component.componentId,
      field.name,
      field.type,
      field.base,
      field.variants,
      field.notes,
      component.risk,
      component.coverage,
    ]);
    writeCsv(path.join(dir, "fields.csv"), fieldHeaders, fieldRows);

    const matrixHeaders = [
      "componentSlug",
      "componentName",
      "componentId",
      "variant",
      "variantNote",
      "fieldName",
      "fieldValue",
    ];
    const matrixRows = [];
    for (const matrixEntry of component.matrix ?? []) {
      for (const [fieldName, fieldValue] of Object.entries(matrixEntry.values)) {
        matrixRows.push([
          slug,
          component.componentName,
          component.componentId,
          matrixEntry.variant,
          matrixEntry.note,
          fieldName,
          fieldValue,
        ]);
      }
    }
    writeCsv(path.join(dir, "matrix.csv"), matrixHeaders, matrixRows);

    const fixtureRows = parseFixtureRows({ slug, ...component });
    const fixtureHeaders = [
      "componentSlug",
      "componentName",
      "componentId",
      "fixturePath",
      "fixtureName",
      "uiSection",
      "uiSubsection",
      "uiLabel",
      "structScope",
      "fieldName",
      "usdType",
      "authoredValue",
      "componentPath",
    ];
    writeCsv(
      path.join(dir, "fixtures.csv"),
      fixtureHeaders,
      fixtureRows.map((row) => [
        row.componentSlug,
        row.componentName,
        row.componentId,
        row.fixturePath,
        row.fixtureName,
        row.uiSection,
        row.uiSubsection,
        row.uiLabel,
        row.structScope,
        row.fieldName,
        row.usdType,
        row.authoredValue,
        row.componentPath,
      ]),
    );

    const componentIndex = {
      slug,
      componentName: component.componentName,
      componentId: component.componentId,
      coverage: component.coverage,
      risk: component.risk,
      paths: {
        schema: `/api/components/${slug}/schema.json`,
        fields: `/api/components/${slug}/fields.csv`,
        matrix: `/api/components/${slug}/matrix.csv`,
        fixtures: `/api/components/${slug}/fixtures.csv`,
      },
      counts: {
        fields: fieldRows.length,
        matrixRows: matrixRows.length,
        fixtureRows: fixtureRows.length,
      },
    };

    fs.writeFileSync(path.join(dir, "index.json"), `${JSON.stringify(componentIndex, null, 2)}\n`, "utf8");
    componentsIndex.push(componentIndex);
  }

  fs.writeFileSync(
    path.join(API_OUT_DIR, "components", "index.json"),
    `${JSON.stringify({ generatedAt: data.generatedAt, components: componentsIndex }, null, 2)}\n`,
    "utf8",
  );

  return componentsIndex;
}

function main() {
  const data = readJson(SCHEMA_JSON);

  resetDir(OUT_DIR);
  resetDir(API_OUT_DIR);
  ensureDir(path.join(API_OUT_DIR, "components"));

  const fieldHeaders = [
    "componentSlug",
    "componentName",
    "componentId",
    "fieldName",
    "fieldType",
    "baseValue",
    "variants",
    "notes",
    "risk",
    "coverage",
  ];
  const fieldsRows = generateFieldsRows(data);
  writeCsv(path.join(OUT_DIR, "fields.csv"), fieldHeaders, fieldsRows);
  console.log(`Generated fields.csv: ${Object.keys(data.bySlug).length} components, ${fieldsRows.length} rows`);

  const matrixHeaders = [
    "componentSlug",
    "componentName",
    "componentId",
    "variant",
    "variantNote",
    "fieldName",
    "fieldValue",
  ];
  const matrixRows = generateMatrixRows(data);
  writeCsv(path.join(OUT_DIR, "matrix.csv"), matrixHeaders, matrixRows);
  console.log(`Generated matrix.csv: ${matrixRows.length} rows`);

  const dataManifest = {
    generatedAt: data.generatedAt,
    endpoints: [
      {
        name: "fields",
        path: "/data/schemas/fields.csv",
        description:
          "One row per component×field. Columns: componentSlug, componentName, componentId, fieldName, fieldType, baseValue, variants, notes, risk, coverage",
        rowCount: fieldsRows.length,
      },
      {
        name: "matrix",
        path: "/data/schemas/matrix.csv",
        description:
          "One row per component×variant×field. Columns: componentSlug, componentName, componentId, variant, variantNote, fieldName, fieldValue",
        rowCount: matrixRows.length,
      },
    ],
  };
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), `${JSON.stringify(dataManifest, null, 2)}\n`, "utf8");

  const componentsIndex = writePerComponentArtifacts(data);
  const apiManifest = {
    generatedAt: data.generatedAt,
    paths: {
      components: "/api/components/index.json",
      aggregateFields: "/data/schemas/fields.csv",
      aggregateMatrix: "/data/schemas/matrix.csv",
    },
    componentCount: componentsIndex.length,
  };
  fs.writeFileSync(path.join(API_OUT_DIR, "index.json"), `${JSON.stringify(apiManifest, null, 2)}\n`, "utf8");

  console.log(`Generated component API exports: ${componentsIndex.length} components`);
}

main();
