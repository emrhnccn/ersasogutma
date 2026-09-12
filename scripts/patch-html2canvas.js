const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.esm.js'),
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.js'),
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'lib', 'css', 'types', 'color.js'),
];

let patchedCount = 0;

for (const target of targets) {
  if (fs.existsSync(target)) {
    let content = fs.readFileSync(target, 'utf8');
    // Replace old throw or old 'return 0;' with solid dark slate #0f172a (253176575)
    const oldFallbacks = [
      'return 0; // Safe fallback for lab, oklch, etc.',
      'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");'
    ];
    let replaced = false;
    for (const old of oldFallbacks) {
      if (content.includes(old)) {
        content = content.replace(old, 'return pack(15, 23, 42, 1); // Solid #0f172a fallback for lab/oklch');
        replaced = true;
      }
    }
    if (replaced) {
      fs.writeFileSync(target, content, 'utf8');
      console.log(`[patch-html2canvas] Successfully patched: ${path.relative(process.cwd(), target)}`);
      patchedCount++;
    } else {
      console.log(`[patch-html2canvas] Already patched or target string not found in: ${path.relative(process.cwd(), target)}`);
    }
  }
}

// Also check minified file
const minTarget = path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.min.js');
if (fs.existsSync(minTarget)) {
  let minContent = fs.readFileSync(minTarget, 'utf8');
  if (minContent.includes('return 0;')) {
    minContent = minContent.replace('return 0;', 'return 253176575;');
    fs.writeFileSync(minTarget, minContent, 'utf8');
    console.log(`[patch-html2canvas] Successfully patched minified: ${path.relative(process.cwd(), minTarget)}`);
    patchedCount++;
  }
}

console.log(`[patch-html2canvas] Patch process completed. (${patchedCount} files patched)`);
