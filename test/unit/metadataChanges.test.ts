import { describe, expect, it } from 'vitest';
import { hasMetadataChanges } from '../../frontend/src/metadataChanges';

const initial = { vct: 'urn:example:pid', name: 'PID', display: [{ locale: 'en', name: 'PID' }] };

describe('unsaved metadata changes', () => {
	it('ignores whitespace and object key order at every depth', () => {
		expect(
			hasMetadataChanges(
				`{
			"display": [{"name": "PID", "locale": "en"}],
			"name": "PID", "vct": "urn:example:pid"
		}`,
				initial,
			),
		).toBe(false);
	});
	it('compares edits against the loaded document, and recognizes a reverted edit', () => {
		expect(hasMetadataChanges(JSON.stringify({ ...initial, name: 'Changed' }), initial)).toBe(
			true,
		);
		expect(hasMetadataChanges(JSON.stringify(initial), initial)).toBe(false);
	});
	it.each(['', '{', '{ "vct":', 'null', '[]'])(
		'protects changed or incomplete input %j',
		(text) => {
			expect(hasMetadataChanges(text, initial)).toBe(true);
		},
	);
	it('treats array order and removed fields as content changes', () => {
		expect(hasMetadataChanges('{"claims":[2,1]}', { claims: [1, 2] })).toBe(true);
		expect(hasMetadataChanges('{"vct":"urn:example:pid"}', initial)).toBe(true);
	});
});
