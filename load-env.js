// Minimal zero-dependency .env loader.
// Reads KEY=VALUE lines from .env into process.env without overriding
// variables already present in the real environment. Lines starting with
// '#' (comments) and blank lines are ignored.
const fs = require("fs");
const path = require("path");

module.exports = function loadEnv(file = path.join(__dirname, ".env")) {
  try {
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue; // skips comments and blanks
      const key = m[1];
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch (e) {
    // No .env file present — rely on the real environment.
  }
};
