#!/usr/bin/env node
/**
 * Prove the built package is loadable before it is published.
 *
 * This library shipped seventeen versions that Node could not load at all.
 * `tsconfig.json` set `"module": "es6"`, so `tsc` wrote ES module syntax into
 * `.js` files, while `package.json` declared no `"type": "module"` — so Node
 * read them as CommonJS and choked on `export`. The relative specifiers were
 * also extensionless, invalid in ESM regardless. Only lenient bundlers such as
 * webpack could consume it, which is why nobody noticed until
 * `@bloomscorp/bloomsight.js` was tested under Vite.
 *
 * A typecheck would not have caught it; neither would a unit test run from
 * source. The only thing that catches it is loading the built artifact the way
 * a consumer does — through the package name, in both module systems.
 */
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function fail(message) {
	console.error(`verify-package: ${message}`);
	process.exitCode = 1;
}

// 1. Everything the manifest points at must exist.
const pointers = [
	['main', pkg.main],
	['module', pkg.module],
	['types', pkg.types],
	['exports["."].import', pkg.exports?.['.']?.import],
	['exports["."].require', pkg.exports?.['.']?.require],
	['exports["."].types', pkg.exports?.['.']?.types]
];

let missing = false;
for (const [field, target] of pointers) {
	if (!target) {
		fail(`package.json has no ${field}`);
		missing = true;
		continue;
	}
	if (!fs.existsSync(path.join(ROOT, target))) {
		fail(`${field} points at ${target}, which does not exist — run "npm run build"`);
		missing = true;
	}
}
if (missing) process.exit(1);
console.log(`verify-package: all ${pointers.length} manifest pointers resolve`);

// 2. No declaration without JavaScript beside it. A .d.ts with no
//    implementation is a promise the package cannot keep: the compiler accepts
//    the import and the runtime has nothing to load.
const dist = path.join(ROOT, 'dist');
const orphans = fs.readdirSync(dist)
	.filter((f) => f.endsWith('.d.ts') || f.endsWith('.d.mts'))
	.filter((f) => {
		const base = f.replace(/\.d\.m?ts$/, '');
		return !fs.existsSync(path.join(dist, `${base}.js`))
			&& !fs.existsSync(path.join(dist, `${base}.mjs`));
	});
if (orphans.length) fail(`declarations with no runtime code: ${orphans.join(', ')}`);
else console.log('verify-package: no orphan declarations');

// 3. The real check — load it as a consumer would, by package name, in both
//    module systems. `--prefix` resolution uses the exports map, so this fails
//    if the map is wrong even when the files are all present.
const expected = [
	'alphaNumericID', 'areStringsEqual', 'arrayDeepCopy', 'arrayEmpty', 'arrayLength',
	'arrayNotEmpty', 'isEmptyObject', 'isEmptyString', 'valueExists'
];

function loadable(label, args) {
	try {
		const out = execFileSync(process.execPath, args, {cwd: ROOT, encoding: 'utf8'}).trim();
		const names = JSON.parse(out);
		const absent = expected.filter((n) => !names.includes(n));
		if (absent.length) {
			fail(`${label}: loaded, but missing exports: ${absent.join(', ')}`);
			return;
		}
		console.log(`verify-package: ${label} resolves and exports all ${expected.length} functions`);
	} catch (error) {
		fail(`${label} could not load the package — this is the bug that shipped 17 times:\n  ${String(error.stderr || error.message).split('\n').slice(0, 4).join('\n  ')}`);
	}
}

loadable('CommonJS require()', ['-e', "console.log(JSON.stringify(Object.keys(require('bmx-pastebox'))))"]);
loadable('ESM import', ['--input-type=module', '-e', "import * as m from 'bmx-pastebox'; console.log(JSON.stringify(Object.keys(m)))"]);

if (process.exitCode) {
	console.error('verify-package: FAILED — do not publish this build');
} else {
	console.log('verify-package: the built package is loadable by consumers');
}
