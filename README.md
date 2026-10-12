# bmx-pastebox

A small collection of pure TypeScript utility functions used internally across
Bloomscorp projects.

```bash
npm install bmx-pastebox
```

Ships both CommonJS and ESM, with types:

```ts
import {isEmptyString, alphaNumericID} from 'bmx-pastebox';
```

```js
const {isEmptyString} = require('bmx-pastebox');
```

## API

| Function | Returns |
|---|---|
| `valueExists(value)` | `false` only for `null` and `undefined`. `0`, `''` and `false` all exist |
| `arrayNotEmpty(array)` | `true` when the array exists and has at least one element |
| `arrayEmpty(array)` | the exact negation of `arrayNotEmpty` |
| `arrayLength(array, length)` | `true` when the array is non-empty **and** exactly `length` long |
| `isEmptyString(str)` | `true` when the string is blank or whitespace only |
| `areStringsEqual(a, b, ignoreCase?)` | `false` if either side is missing; case sensitive unless asked |
| `arrayDeepCopy(array)` | a JSON round-trip copy |
| `isEmptyObject(obj)` | `true` when the object has no own keys |
| `alphaNumericID(length?)` | a random alphanumeric string, 12 characters by default |

## Behaviour worth knowing

Three things surprise people. All are long-standing and deliberately unchanged,
because other projects depend on exactly what these do today — changing them
would be a breaking change. They are covered by tests so they cannot drift.

**`isEmptyString(undefined)` returns `false`, not `true`.** The implementation
is `valueExists(str) && …`, so a missing value is reported as *not* empty. If
you need "blank or missing", test both:

```ts
if (!valueExists(x) || isEmptyString(x)) { /* … */ }
```

**`isEmptyObject(null)` throws.** Unlike the other predicates it has no
existence guard, so it raises rather than returning a boolean. Guard the call
site.

**`arrayLength([], 0)` returns `false`.** `arrayNotEmpty` gates it first, so an
empty array never matches any length, including zero.

## ⚠️ `alphaNumericID` is not cryptographically secure

It uses `Math.random()`, whose output is predictable from prior observations. It
is fine for DOM ids, cache keys, test fixtures and correlation ids.

**Do not use it for anything an attacker should not be able to guess** — session
identifiers, access or reset tokens, password-reset links, API keys, or
anything else security-bearing. Use `crypto.randomUUID()` or
`crypto.getRandomValues()` for those.

## Development

```bash
npm run lint            # typecheck only — tsc never emits here
npm test                # vitest
npm run build           # tsup, dual CJS + ESM + declarations
npm run verify:package  # loads the built package as a consumer would
```

`npm run verify:package` exists because of a real failure. Through version
1.0.17 this package was **unloadable from Node in both module systems**:
`tsconfig.json` set `"module": "es6"`, so `tsc` wrote ESM syntax into `.js`
files, while `package.json` declared no `"type": "module"`; the relative imports
were also extensionless, invalid in ESM regardless. Only lenient bundlers such
as webpack could consume it, so it went unnoticed for years — until
`@bloomscorp/bloomsight.js` was tested under Vite and failed to load.

Neither a typecheck nor tests run from source catch that, because in `src/` the
code is perfectly valid. The only check that catches it is loading the **built**
artifact through the package name, in both module systems, which is what that
script does.

## Releasing

```bash
npm run release
```

Local `release-it` runs the gates (typecheck, test, build, package
verification), writes the version and changelog, commits, tags and pushes. The
tag triggers `.github/workflows/release.yml`, which re-runs the gates and
publishes to npm via a **trusted publisher** (OIDC) — no token is stored
anywhere.

Commit messages follow the Angular convention (`feat:`, `fix:`, `docs:`,
`perf:`, `build:`), which is what drives the version bump and the changelog.
