const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// Inline CSS
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => {
  const file = path.join(distDir, href.replace(/^\.\//, ''));
  const css = fs.readFileSync(file, 'utf8');
  return `<style>${css}</style>`;
});

// Inline JS
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  const file = path.join(distDir, src.replace(/^\.\//, ''));
  const js = fs.readFileSync(file, 'utf8');
  return `<script type="module">${js}</script>`;
});

const out = path.join(__dirname, 'ZTP-prototype.html');
fs.writeFileSync(out, html);
console.log('Done! File saved to: ' + out);
console.log('Size: ' + (fs.statSync(out).size / 1024 / 1024).toFixed(1) + ' MB');
