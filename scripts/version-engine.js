// After the build: give every engine script in build/index.html a content hash (?v=...), so a deploy that
// changes an engine file also changes its address. Without it, browsers and Cloudflare's cache kept serving
// the old public/engine/*.js for hours next to the new app bundle. Runs as npm's postbuild.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dir = path.join(__dirname, '..', 'build'), html = path.join(dir, 'index.html');
let s = fs.readFileSync(html, 'utf8'), n = 0;
s = s.replace(/(src="[^"]*\/engine\/([\w.-]+\.js))(\?v=[0-9a-f]+)?"/g, (m, url, file) => {
  const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, 'engine', file))).digest('hex').slice(0, 10);
  n++; return `${url}?v=${hash}"`;
});
fs.writeFileSync(html, s);
console.log(`version-engine: ${n} engine scripts tagged`);
