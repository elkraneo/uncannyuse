import fs from "node:fs";
import path from "node:path";

const SITE_ROOT = "/Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com";
const SCHEMA_JSON = path.join(SITE_ROOT, "src/data/schemas/fixture-schemas.json");
const OUT_DIR = path.join(SITE_ROOT, "public/data/schemas");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateFieldsCsv(data) {
  const headers = [
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

  const rows = [];
  for (const [slug, component] of Object.entries(data.bySlug)) {
    if (!component.fields) continue;
    for (const field of component.fields) {
      rows.push([
        escapeCsv(slug),
        escapeCsv(component.componentName),
        escapeCsv(component.componentId),
        escapeCsv(field.name),
        escapeCsv(field.type),
        escapeCsv(field.base),
        escapeCsv(field.variants),
        escapeCsv(field.notes),
        escapeCsv(component.risk),
        escapeCsv(component.coverage),
      ]);
    }
  }

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function generateMatrixCsv(data) {
  const headers = [
    "componentSlug",
    "componentName",
    "componentId",
    "variant",
    "variantNote",
    "fieldName",
    "fieldValue",
  ];

  const rows = [];
  for (const [slug, component] of Object.entries(data.bySlug)) {
    if (!component.matrix) continue;
    for (const matrixEntry of component.matrix) {
      for (const [fieldName, fieldValue] of Object.entries(matrixEntry.values)) {
        rows.push([
          escapeCsv(slug),
          escapeCsv(component.componentName),
          escapeCsv(component.componentId),
          escapeCsv(matrixEntry.variant),
          escapeCsv(matrixEntry.note),
          escapeCsv(fieldName),
          escapeCsv(fieldValue),
        ]);
      }
    }
  }

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function main() {
  const data = readJson(SCHEMA_JSON);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const fieldsCsv = generateFieldsCsv(data);
  const matrixCsv = generateMatrixCsv(data);

  fs.writeFileSync(path.join(OUT_DIR, "fields.csv"), fieldsCsv, "utf8");
  console.log(`Generated fields.csv: ${Object.keys(data.bySlug).length} components, ${fieldsCsv.split("\n").length - 1} rows`);

  fs.writeFileSync(path.join(OUT_DIR, "matrix.csv"), matrixCsv, "utf8");
  console.log(`Generated matrix.csv: ${matrixCsv.split("\n").length - 1} rows`);

  const manifest = {
    generatedAt: data.generatedAt,
    endpoints: [
      {
        name: "fields",
        path: "/data/schemas/fields.csv",
        description: "One row per component×field. Columns: componentSlug, componentName, componentId, fieldName, fieldType, baseValue, variants, notes, risk, coverage",
        rowCount: fieldsCsv.split("\n").length - 1,
      },
      {
        name: "matrix",
        path: "/data/schemas/matrix.csv",
        description: "One row per component×variant×field. Columns: componentSlug, componentName, componentId, variant, variantNote, fieldName, fieldValue",
        rowCount: matrixCsv.split("\n").length - 1,
      },
    ],
  };

  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated index.json manifest`);
}

main();
