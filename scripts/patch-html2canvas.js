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
    const targetError = 'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';
    if (content.includes(targetError)) {
      content = content.replace(targetError, 'return 0; // Safe fallback for lab, oklch, etc.');
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
  const minErrorRegex = /throw new Error\("Attempting to parse an unsupported color function \\""\+[a-zA-Z0-9_$]+\.name\+"\\""\);?/;
  if (minErrorRegex.test(minContent)) {
    minContent = minContent.replace(minErrorRegex, 'return 0;');
    fs.writeFileSync(minTarget, minContent, 'utf8');
    console.log(`[patch-html2canvas] Successfully patched minified: ${path.relative(process.cwd(), minTarget)}`);
    patchedCount++;
  }
}

console.log(`[patch-html2canvas] Patch process completed. (${patchedCount} files patched)`);
