import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { countries } from '../src/data/countries.ts';
import { acceptRegion } from '../src/game.ts';
import { parseCatalogue } from '../src/catalog.ts';

const packaged = JSON.parse(await readFile(new URL('../public/content/catalog.json', import.meta.url), 'utf8'));
const israel = countries.find(country => country.id === 'israel');
const star = israel.flag.regions.find(region => region.id === 'blue-star');

// The star uses straight closed contours. Winding detects filled blue areas and white holes.
function windingAt(path, x, y) {
  const tokens = path.match(/[MLHZ]|-?\d+(?:\.\d+)?/g);
  const contours = [];
  let current = [], point;
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++];
    if (command === 'M' || command === 'L') {
      point = [Number(tokens[i++]), Number(tokens[i++])];
      current.push(point);
    } else if (command === 'H') {
      point = [Number(tokens[i++]), point[1]];
      current.push(point);
    } else if (command === 'Z') {
      contours.push(current);
      current = [];
    } else throw new Error(`Unexpected path command: ${command}`);
  }
  let winding = 0;
  for (const contour of contours) {
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i], b = contour[(i + 1) % contour.length];
      const side = (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]);
      if (a[1] <= y && b[1] > y && side > 0) winding++;
      if (a[1] > y && b[1] <= y && side < 0) winding--;
    }
  }
  return winding;
}

test('Israel requires painting the star as well as all five flag bands', () => {
  assert.ok(star);
  assert.equal(star.colorId, 2);
  assert.equal(israel.flag.prepaintedPaths, undefined);
  const bands = israel.flag.regions.filter(region => region.id !== star.id);
  let painted = [];
  for (const band of bands) painted = acceptRegion(painted, band.id, band.colorId, israel.flag.regions);
  assert.equal(painted.length, 5);
  assert.ok(!painted.includes(star.id));
  assert.notEqual(painted.length, israel.flag.regions.length);
  assert.deepEqual(acceptRegion(painted, star.id, 3, israel.flag.regions), painted);
  painted = acceptRegion(painted, star.id, 2, israel.flag.regions);
  assert.equal(painted.length, israel.flag.regions.length);
  assert.equal(israel.flag.regions.at(-1).id, star.id);
});

test('the painted star has seven white openings and a generous touch silhouette', () => {
  assert.equal(star.fillRule, 'nonzero');
  for (const [x, y] of [[450, 300], [450, 229], [450, 371], [393, 267], [507, 267], [393, 333], [507, 333]]) {
    assert.equal(windingAt(star.path, x, y), 0, `white opening at ${x},${y}`);
  }
  for (const [x, y] of [[450, 196], [450, 250], [450, 350], [450, 404]]) {
    assert.ok(windingAt(star.path, x, y) > 0, `blue outline at ${x},${y}`);
  }
  assert.ok(windingAt(star.hitPath, 450, 300) > 0, 'the central number is a valid touch target');
});

test('the download catalogue and bundled source agree on country geometry and media', () => {
  assert.deepEqual(packaged.countries, countries, 'download catalogue and bundled source must agree');
});

test('malformed hit paths are rejected', () => {
  const value = structuredClone(packaged);
  value.countries.find(country => country.id === 'israel').flag.regions.at(-1).hitPath = '<script>';
  assert.equal(parseCatalogue(value), null);
});
