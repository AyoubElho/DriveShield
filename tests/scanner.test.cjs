const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { scanDirectory } = require('../electron/scanner.cjs');

async function fixture(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'driveshield-test-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  return root;
}

test('flags USB-risk filenames while leaving benign files unflagged', async t => {
  const root = await fixture({
    'autorun.inf': '[autorun]\nopen=payload.exe',
    'tools/launch.cmd': '@echo off',
    '.hidden-cache/notes.txt': 'hidden test directory',
    'docs/readme.txt': 'This is ordinary text.',
    'photos/picture.jpg': 'not an image, but harmless for this test'
  });
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const report = await scanDirectory(root);
  assert.equal(report.scanned, 5);
  assert.deepEqual(report.findings.map(item => [item.kind, item.severity]).sort(), [
    ['Autorun configuration', 'high'],
    ['CMD executable or script', 'high'],
    ['Hidden folder', 'medium']
  ]);
});

test('flags symbolic links without following them', async t => {
  const root = await fixture({ 'safe.txt': 'safe' });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.symlink('/tmp', path.join(root, 'outside-link'));

  const report = await scanDirectory(root);
  assert.equal(report.scanned, 1);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].kind, 'Symbolic link');
  assert.equal(report.findings[0].severity, 'medium');
});

test('rejects locations that do not exist', async () => {
  await assert.rejects(scanDirectory('/tmp/driveshield-location-that-does-not-exist'), /cannot be read/);
});
