// Parses every inline <script> of an index.html as ES2017 (Chromium 69 = Android 8 WebView).
//   node _tools/es2017check.js ToNet/index.html
// Exit 0 = every script parses with ecmaVersion 2017; otherwise prints the first error per script.
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(__dirname, 'node_modules', 'acorn'));

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let bad = 0;
let count = 0;
while ((m = re.exec(html))) {
  count++;
  const startLine = html.slice(0, m.index).split('\n').length;
  try {
    acorn.parse(m[1], { ecmaVersion: 2017, sourceType: 'script' });
  } catch (e) {
    bad++;
    const line = e.loc ? startLine + e.loc.line - 1 : startLine;
    console.log(`ES2017 parse error in script #${count} at html line ${line}: ${e.message}`);
  }
}
console.log(`${count} inline script(s) checked, ${bad} error(s)`);
process.exit(bad ? 1 : 0);
