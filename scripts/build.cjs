const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src');
const template = fs.readFileSync(path.join(sourceRoot, 'index.html'), 'utf8');
const html = template.replace(/^[ \t]*<!-- include: (partials\/[\w-]+\.html) -->\r?\n/gm,
  (_, file) => fs.readFileSync(path.join(sourceRoot, file), 'utf8'));
const output = path.join(root, 'public', 'index.html');

if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== html) {
    console.error('public/index.html is out of date. Run node scripts/build.cjs');
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(output, html);
  console.log('Built public/index.html');
}
