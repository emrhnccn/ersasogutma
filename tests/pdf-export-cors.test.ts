import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PDF EXPORT & CORS PROXY TESTS', async (t) => {
  const root = process.cwd();

  await t.test('1. Proxy-image API route exists and sets CORS headers', () => {
    const routePath = path.join(root, 'src/app/api/proxy-image/route.ts');
    assert.ok(fs.existsSync(routePath), 'proxy-image route.ts must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(content.includes("'Access-Control-Allow-Origin': '*'"), 'Must set Access-Control-Allow-Origin');
    assert.ok(content.includes('FALLBACK_1X1_PNG'), 'Must have fallback image on error');
    assert.ok(content.includes('targetUrl.startsWith'), 'Must validate URL protocol');
  });

  await t.test('2. Package.json postinstall includes html2canvas patcher', () => {
    const pkgPath = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert.ok(pkg.scripts?.postinstall?.includes('patch-html2canvas.js'), 'postinstall must include patch-html2canvas.js');
  });

  await t.test('3. Html2canvas patch script exists and targets color parsing', () => {
    const scriptPath = path.join(root, 'scripts/patch-html2canvas.js');
    assert.ok(fs.existsSync(scriptPath), 'patch-html2canvas.js must exist');
    const content = fs.readFileSync(scriptPath, 'utf8');

    assert.ok(content.includes('Attempting to parse an unsupported color function'), 'Must target unsupported color function error');
  });

  await t.test('4. OrderPrintDocument routes external images through proxy-image', () => {
    const docPath = path.join(root, 'src/components/orders/OrderPrintDocument.tsx');
    const content = fs.readFileSync(docPath, 'utf8');

    assert.ok(content.includes('/api/proxy-image?url='), 'Must proxy external images');
    assert.ok(!content.includes('crossOrigin="anonymous"'), 'Must NOT have crossOrigin="anonymous" to avoid browser blocking');
  });

  await t.test('5. PdfExport converts images to DataURLs ahead of rendering', () => {
    const pdfPath = path.join(root, 'src/lib/export/pdfExport.ts');
    const content = fs.readFileSync(pdfPath, 'utf8');

    assert.ok(content.includes('toDataUrl'), 'Must define toDataUrl helper');
    assert.ok(content.includes('allowTaint: true'), 'Must allow canvas drawing');
    assert.ok(content.includes('jsPDF'), 'Must initialize jsPDF');
  });
});
