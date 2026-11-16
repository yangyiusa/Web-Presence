import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

// Verify the actual authored cells tile the panel, including its portrait transpose.
const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const cells = vm.runInNewContext(source.match(/const cellNames = (\[.*\]);/)[1]);
const points = vm.runInNewContext(`(${source.match(/const basePoints = (\{.*\});/)[1]})`);
for (const transpose of [false, true]) {
  let total = 0;
  for (const cell of cells) {
    const polygon = cell.map((key) => transpose ? [points[key][1], points[key][0]] : points[key]);
    const area = Math.abs(polygon.reduce((sum, a, i) => {
      const b = polygon[(i + 1) % polygon.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0)) / 2;
    assert.ok(area > .01, 'Every cell must have a visible face');
    total += area;
  }
  assert.ok(Math.abs(total - 1) < 1e-10, 'Cells must cover the panel exactly');
}

const easeSource = source.match(/const easeOutBack = (.*);/)[1];
const ease = vm.runInNewContext(easeSource);
assert.ok(Math.abs(ease(0)) < 1e-12);
assert.equal(ease(1), 1);
assert.ok(ease(.7) > 1, 'Reassembly must include a small overshoot');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes('three@0.169.0'));
const pages = ['index.html', 'about.html', 'team.html', 'tutorial.html'];
for (const page of pages) {
  const content = readFileSync(new URL(page, import.meta.url), 'utf8');
  assert.ok(content.includes('ShelfWise'), `${page} must identify the project`);
  assert.ok(!content.includes('Facet'), `${page} must not retain template copy`);
  for (const [, path] of content.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|#)/.test(path)) continue;
    assert.ok(existsSync(new URL(path.split('#')[0], import.meta.url)), `${page}: missing ${path}`);
  }
}
const team = readFileSync(new URL('./team.html', import.meta.url), 'utf8');
const bios = [...team.matchAll(/<div class="biography">([\s\S]*?)<\/div>/g)];
assert.equal(bios.length, 4);
for (const [, bio] of bios) {
  const words = bio.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  assert.ok(words >= 150 && words <= 250, `Biography must be 150–250 words, got ${words}`);
}
const tutorial = readFileSync(new URL('./tutorial.js', import.meta.url), 'utf8');
for (const [, image] of tutorial.matchAll(/image: '([^']+)'/g)) assert.ok(existsSync(new URL(`assets/${image}`, import.meta.url)));
assert.equal((tutorial.match(/title: '/g) || []).length, 5);
console.log('PASS: glass geometry and easing; four pages and local links; four 150–250 word bios; five tutorial steps and screenshots.');
