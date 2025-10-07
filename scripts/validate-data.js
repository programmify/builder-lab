import fs from "fs";
import path from "path";

const REQUIRED_KEYS = [
  "name",
  "description",
  "link",
  "type",
  "category",
  "tags",
  "popularity",
  "tutorial"
];

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON: ${filePath}: ${e.message}`);
  }
  if (!Array.isArray(data)) throw new Error(`Expected array in ${filePath}`);
  data.forEach((tool, index) => {
    for (const key of REQUIRED_KEYS) {
      if (!(key in tool)) {
        throw new Error(`${filePath}[${index}] missing key: ${key}`);
      }
    }
    if (!Array.isArray(tool.tags)) {
      throw new Error(`${filePath}[${index}] tags must be an array`);
    }
  });
}

function main() {
  const dir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const errors = [];
  for (const f of files) {
    const fp = path.join(dir, f);
    try {
      validateFile(fp);
      console.log(`✔ Valid: ${f}`);
    } catch (e) {
      console.error(`✖ Error in ${f}: ${e.message}`);
      errors.push(f);
    }
  }
  if (errors.length) {
    console.error(`\nValidation failed for ${errors.length} files.`);
    process.exit(1);
  } else {
    console.log("\nAll data files valid.");
  }
}

main();


