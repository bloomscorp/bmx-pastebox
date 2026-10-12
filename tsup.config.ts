import {defineConfig} from 'tsup';

/**
 * Replaces a bare `npx tsc` build, which is what shipped a broken package for
 * every release up to 1.0.17.
 *
 * `tsconfig.json` set `"module": "es6"`, so `tsc` wrote ES module syntax into
 * `.js` files — while `package.json` declared no `"type": "module"`. Node
 * therefore read `dist/index.js` as CommonJS, found `export * from './pastebox'`
 * in it, and failed. The relative specifier was also extensionless, which is
 * invalid ESM even with `type: module` set. The package was unusable from Node
 * in **both** module systems; only lenient bundlers like webpack could load it,
 * which is why it went unnoticed.
 *
 * tsup emits real dual output — `.js` (CJS) and `.mjs` (ESM) — with the
 * extensions and declarations to match, and `package.json` points at them
 * through an `exports` map.
 */
export default defineConfig({
	entry: ['./src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	sourcemap: false,
	clean: true,
	treeshake: true,
	// No minification: this is a utility library read by humans debugging their
	// own code, and the whole thing is 44 lines.
	minify: false
});
