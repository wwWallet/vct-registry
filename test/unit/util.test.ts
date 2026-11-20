import { describe, expect, it } from 'vitest';
import { decodeIdentifier, parseIdentifier } from '../../src/util';

const expectedResult = 'urn:vct:test';

describe('identifier encoding/decoding', () => {
	it.each([
		'org.iso.18013.5.1.mDL',
		'urn:eudi:pid:1',
		'https://example.org/types/pid?v=1&lang=en',
		'credential type with spaces',
	])(
		'decodes raw and encoded identifier %s independently of the query parameter name',
		(identifier) => {
			expect(decodeIdentifier(identifier)).toBe(identifier);
			expect(decodeIdentifier(encodeURIComponent(identifier))).toBe(identifier);
		},
	);

	it.each([undefined, null, ''])('returns undefined for missing identifier %s', (value) => {
		expect(decodeIdentifier(value)).toBeUndefined();
	});

	it.each([['a', 'b'], { id: 'a' }, 42, true])('rejects a non-string identifier %j', (value) => {
		expect(decodeIdentifier(value)).toBeNull();
	});

	it('trims surrounding whitespace', () => {
		expect(decodeIdentifier('  org.example.document  ')).toBe('org.example.document');
	});
	it('Should handle unencoded URNs', () => {
		const result = decodeIdentifier('urn:vct:test');
		expect(result).toBe(expectedResult);
	});

	it('Should handle encoded URNs', () => {
		const result = decodeIdentifier('urn%3Avct%3Atest');
		expect(result).toBe(expectedResult);
	});

	it('Should handle partially encoded URNs', () => {
		const result = decodeIdentifier('urn:vct%3Atest');
		expect(result).toBe(expectedResult);
	});
});

describe('transport-decoded identifier validation', () => {
	it.each([
		'https://example.org/types/a%2Fb',
		'org.example.%25.document',
		'org.example.100%',
		' org.example.document ',
	])('preserves %s exactly', (identifier) => {
		expect(parseIdentifier(identifier)).toBe(identifier);
	});
	it.each([undefined, null, ''])('recognizes missing value %s', (value) => {
		expect(parseIdentifier(value)).toBeUndefined();
	});
	it.each([' ', '\t', ['a'], { id: 'a' }, 42, false])('rejects invalid value %j', (value) => {
		expect(parseIdentifier(value)).toBeNull();
	});
});
