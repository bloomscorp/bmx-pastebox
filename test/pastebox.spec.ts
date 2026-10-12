import {describe, expect, test} from 'vitest';

import {
	alphaNumericID,
	areStringsEqual,
	arrayDeepCopy,
	arrayEmpty,
	arrayLength,
	arrayNotEmpty,
	isEmptyObject,
	isEmptyString,
	valueExists
} from '../src';

/**
 * This library had no tests and no CI through 17 published versions. These
 * exist to pin **current** behaviour, not to assert what the functions ideally
 * ought to do — other Bloomscorp projects depend on exactly what they do now,
 * so the two surprises below are asserted as-is and documented rather than
 * quietly corrected.
 */
describe('valueExists', () => {
	test('false only for null and undefined', () => {
		expect(valueExists(undefined)).toBe(false);
		expect(valueExists(null)).toBe(false);
		// Everything else exists, including the falsy values.
		expect(valueExists(0)).toBe(true);
		expect(valueExists('')).toBe(true);
		expect(valueExists(false)).toBe(true);
		expect(valueExists(NaN)).toBe(true);
	});
});

describe('array predicates', () => {
	test('arrayNotEmpty', () => {
		expect(arrayNotEmpty([1])).toBe(true);
		expect(arrayNotEmpty([])).toBe(false);
		expect(arrayNotEmpty(null as unknown as any[])).toBe(false);
		expect(arrayNotEmpty(undefined as unknown as any[])).toBe(false);
	});

	test('arrayEmpty is the exact negation', () => {
		for (const input of [[1], [], null, undefined] as any[]) {
			expect(arrayEmpty(input)).toBe(!arrayNotEmpty(input));
		}
	});

	test('arrayLength', () => {
		expect(arrayLength([1, 2, 3], 3)).toBe(true);
		expect(arrayLength([1, 2, 3], 2)).toBe(false);
		// Empty never matches, not even length 0 — arrayNotEmpty gates it first.
		expect(arrayLength([], 0)).toBe(false);
		expect(arrayLength(null as unknown as any[], 0)).toBe(false);
	});
});

describe('isEmptyString', () => {
	test('true for blank strings', () => {
		expect(isEmptyString('')).toBe(true);
		expect(isEmptyString('   ')).toBe(true);
		expect(isEmptyString('\t\n')).toBe(true);
	});

	test('false for strings with content', () => {
		expect(isEmptyString('a')).toBe(false);
		expect(isEmptyString('  a  ')).toBe(false);
	});

	test('SURPRISE: null and undefined are NOT reported empty', () => {
		// The implementation is `valueExists(str) && …`, so a missing value
		// returns false — "not empty". Reads backwards, and a caller writing
		// `if (isEmptyString(maybe))` will not catch undefined.
		//
		// Pinned, not fixed: this is used across Bloomscorp projects (including
		// bloomsight.js) and flipping it would change their behaviour silently.
		// Changing it is a breaking change and belongs to a major version.
		expect(isEmptyString(undefined as unknown as string)).toBe(false);
		expect(isEmptyString(null as unknown as string)).toBe(false);
	});
});

describe('areStringsEqual', () => {
	test('case sensitive by default', () => {
		expect(areStringsEqual('abc', 'abc')).toBe(true);
		expect(areStringsEqual('abc', 'ABC')).toBe(false);
	});

	test('case insensitive when asked', () => {
		expect(areStringsEqual('abc', 'ABC', true)).toBe(true);
	});

	test('false when either side is missing', () => {
		expect(areStringsEqual(null as unknown as string, 'a')).toBe(false);
		expect(areStringsEqual('a', undefined as unknown as string)).toBe(false);
		// Including when both are missing, so it is never "equal by absence".
		expect(areStringsEqual(null as unknown as string, null as unknown as string)).toBe(false);
	});
});

describe('arrayDeepCopy', () => {
	test('copies nested values without sharing references', () => {
		const original = [{a: {b: 1}}];
		const copy = arrayDeepCopy(original);

		expect(copy).toEqual(original);
		expect(copy[0]).not.toBe(original[0]);

		copy[0].a.b = 2;
		expect(original[0]!.a.b).toBe(1);
	});

	test('it is JSON-based, so non-JSON values do not survive', () => {
		// Documented via the implementation's linked source, worth making
		// explicit: functions vanish, Dates become strings, undefined is
		// dropped. Anyone copying those needs structuredClone instead.
		const copy = arrayDeepCopy([{fn: () => 1, when: new Date(0), gone: undefined}]);
		expect(copy[0]).toEqual({when: '1970-01-01T00:00:00.000Z'});
	});
});

describe('isEmptyObject', () => {
	test('true only with no own keys', () => {
		expect(isEmptyObject({})).toBe(true);
		expect(isEmptyObject({a: 1})).toBe(false);
	});

	test('SURPRISE: throws on null and undefined', () => {
		// Unlike every other predicate here, this one has no valueExists guard,
		// so it throws rather than returning a boolean. Pinned so the
		// inconsistency is visible; fixing it is a behaviour change.
		expect(() => isEmptyObject(null)).toThrow();
		expect(() => isEmptyObject(undefined)).toThrow();
	});
});

describe('alphaNumericID', () => {
	test('defaults to 12 characters', () => {
		expect(alphaNumericID()).toHaveLength(12);
	});

	test('honours an explicit length', () => {
		expect(alphaNumericID(1)).toHaveLength(1);
		expect(alphaNumericID(64)).toHaveLength(64);
		expect(alphaNumericID(0)).toHaveLength(0);
	});

	test('uses only alphanumeric characters', () => {
		expect(alphaNumericID(200)).toMatch(/^[0-9a-zA-Z]*$/);
	});

	test('does not repeat in practice', () => {
		const ids = new Set(Array.from({length: 500}, () => alphaNumericID()));
		expect(ids.size).toBe(500);
	});

	// NOTE: this is `Math.random`, which is not cryptographically secure and is
	// predictable from observed output. Fine for DOM ids and cache keys; it must
	// not be used for tokens, session ids, password resets or anything an
	// attacker should not be able to guess. See the README.
});
