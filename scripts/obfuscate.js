/**
 * Post-build obfuscation script.
 * Minifies and mangles all JS files in dist/ to protect source code.
 */

const { minify } = require("terser");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");

const terserOptions = {
  compress: {
    dead_code: true,
    drop_console: false, // keep console.error for MCP stdio
    passes: 2,
  },
  mangle: {
    toplevel: true,
    reserved: ["main"], // keep entry point name
  },
  format: {
    comments: false,
  },
};

async function obfuscateDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await obfuscateDir(full);
    } else if (entry.name.endsWith(".js")) {
      const code = fs.readFileSync(full, "utf-8");
      const result = await minify(code, terserOptions);
      if (result.code) {
        fs.writeFileSync(full, result.code, "utf-8");
      }
    }
  }
}

obfuscateDir(DIST)
  .then(() => console.log("Obfuscation complete: dist/ files minified and mangled"))
  .catch((err) => {
    console.error("Obfuscation failed:", err);
    process.exit(1);
  });
