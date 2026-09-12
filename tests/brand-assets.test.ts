import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('BRAND IDENTITY & ASSETS TESTS', async (t) => {
  const rootDir = process.cwd();

  await t.test('1. Generated brand logo files exist and are non-empty', () => {
    const requiredFiles = [
      'public/icon.png',
      'public/favicon.ico',
      'public/favicon-32x32.png',
      'public/favicon-16x16.png',
      'public/apple-touch-icon.png',
      'src/app/icon.png',
      'src/app/favicon.ico',
      'src/app/apple-icon.png',
      'public/images/logo/app-icon.png',
      'public/images/logo/brand-logo-light.png',
      'public/images/logo/brand-logo-light-transparent.png',
      'public/images/logo/brand-emblem-light.png',
      'public/images/logo/brand-logo-dark.png',
      'public/images/logo/brand-emblem-dark.png',
      'public/site.webmanifest'
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 0, `File must not be empty: ${relPath}`);
    }
  });

  await t.test('2. Root layout metadata has favicon and app icon configured', () => {
    const layoutPath = path.join(rootDir, 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(content.includes("url: '/icon.png'"), 'Should include /icon.png');
    assert.ok(content.includes("url: '/favicon.ico'"), 'Should include /favicon.ico');
    assert.ok(content.includes("url: '/apple-touch-icon.png'"), 'Should include /apple-touch-icon.png');
    assert.ok(content.includes("manifest: '/site.webmanifest'"), 'Should include manifest');
  });

  await t.test('3. BrandLogo component exists and exports BrandLogo and BrandEmblem', () => {
    const componentPath = path.join(rootDir, 'src/components/common/BrandLogo.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(content.includes('export function BrandLogo'), 'Should export BrandLogo');
    assert.ok(content.includes('export function BrandEmblem'), 'Should export BrandEmblem');
    assert.ok(content.includes('SOĞUTMA'), 'Should render brand text SOĞUTMA');
  });

  await t.test('4. Headers and sidebars use the new brand logo and industrial orange accents', () => {
    const headerPath = path.join(rootDir, 'src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert.ok(headerContent.includes('app-icon.png'), 'Header should use app-icon.png');
    assert.ok(headerContent.includes('text-orange-600'), 'Header should style SOĞUTMA in orange');

    const sidebarPath = path.join(rootDir, 'src/components/layout/Sidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(sidebarContent.includes('app-icon.png'), 'Sidebar should use app-icon.png');
    assert.ok(sidebarContent.includes('text-orange-600'), 'Sidebar should style SOĞUTMA in orange');

    const publicHeaderPath = path.join(rootDir, 'src/components/layout/PublicHeader.tsx');
    const publicHeaderContent = fs.readFileSync(publicHeaderPath, 'utf8');
    assert.ok(publicHeaderContent.includes('brand-emblem-light.png'), 'PublicHeader should use brand emblem');
    assert.ok(publicHeaderContent.includes('text-orange-600'), 'PublicHeader should style SOĞUTMA in orange');
  });

  await t.test('5. OrderPrintDocument has brand emblem and styling', () => {
    const printDocPath = path.join(rootDir, 'src/components/orders/OrderPrintDocument.tsx');
    const printDocContent = fs.readFileSync(printDocPath, 'utf8');
    assert.ok(printDocContent.includes('brand-emblem-light.png'), 'Print doc should have brand emblem');
    assert.ok(printDocContent.includes('text-orange-600'), 'Print doc should style SOĞUTMA in orange');
  });
});
