// Turns web/index.html (the same file as the website) into src/web.js, which the app bundles.
// The GitHub build runs this by itself, so updating the app = replacing web/index.html.
const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "web", "index.html"), "utf8");
if (!html.includes("ReactNativeWebView")) throw new Error("web/index.html is too old: it has no app bridge");
fs.writeFileSync(
  path.join(__dirname, "..", "src", "web.js"),
  "// Generated from web/index.html — don't edit by hand.\nexport default " + JSON.stringify(html) + ";\n"
);
console.log("src/web.js written (" + html.length + " chars)");
