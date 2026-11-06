import { describe, expect, it } from 'vitest';
import { addMetadataUriIntegrity } from '../../frontend/src/uriIntegrity';
import type { TypeMetadata } from '../../frontend/src/types';

function metadataWithUri(uri: string, integrity: string): TypeMetadata {
	return {
		vct: 'urn:vct:test',
		display: [
			{
				rendering: {
					svg_templates: [{ uri, 'uri#integrity': integrity }],
				},
			},
		],
	};
}

function integrityOf(metadata: TypeMetadata): unknown {
	return metadata.display?.[0].rendering?.svg_templates?.[0]['uri#integrity'];
}

describe('frontend URI integrity', () => {
	it('recalculates stale integrity for non-base64 data URIs', async () => {
		const metadata = metadataWithUri(
			'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
			'sha256-stale',
		);

		const updated = await addMetadataUriIntegrity(metadata);

		expect(integrityOf(updated)).toMatch(/^sha256-/);
		expect(integrityOf(updated)).not.toBe('sha256-stale');
		expect(integrityOf(metadata)).toBe('sha256-stale');
	});

	it('leaves base64 data URIs unchanged', async () => {
		const metadata = metadataWithUri('data:image/png;base64,AA==', 'sha256-existing');

		const updated = await addMetadataUriIntegrity(metadata);

		expect(integrityOf(updated)).toBe('sha256-existing');
	});
});
