import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const testRoot = path.resolve(".tmp/unit-tests/tests/unit");

async function collectTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(entryPath);
      }

      return entry.name.endsWith(".test.js") ? [entryPath] : [];
    })
  );

  return files.flat().sort();
}

for (const file of await collectTestFiles(testRoot)) {
  await import(pathToFileURL(file).href);
}
