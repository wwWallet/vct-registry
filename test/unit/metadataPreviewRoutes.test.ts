import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiRouter from '../../src/routes/api';
import { getTypeMetadataByIdentifier } from '../../src/db/typeMetadata';
import { getMetadataPreviewDataUri } from '../../src/util/metadataPreview';

vi.mock('../../src/server', () => ({ db: {} }));
vi.mock('../../src/db/typeMetadata', () => ({
	getAllTypeMetadata: vi.fn(),
	getTypeMetadataByIdentifier: vi.fn(),
}));
vi.mock('../../src/util/metadataPreview', () => ({ getMetadataPreviewDataUri: vi.fn() }));
const app = express();
app.use('/api', apiRouter);
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(getMetadataPreviewDataUri).mockResolvedValue('data:image/svg+xml;base64,AA==');
});

describe('Stored metadata previews', () => {
	it.each([{ vct: 'urn:example:pid' }, { doctype: 'org.example.a%2Fb&c' }])(
		'renders either format using its exact identifier',
		async (metadata) => {
			const identifier = 'vct' in metadata ? metadata.vct : metadata.doctype;
			vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(metadata);
			const response = await request(app)
				.get('/api/type-metadata-preview')
				.query({ identifier })
				.expect(200);
			expect(getTypeMetadataByIdentifier).toHaveBeenCalledWith(expect.anything(), identifier);
			expect(getMetadataPreviewDataUri).toHaveBeenCalledWith(metadata, {
				preferredProperties: { orientation: 'landscape' },
			});
			expect(response.body.dataUri).toBe('data:image/svg+xml;base64,AA==');
		},
	);
	it.each([{}, { identifier: '' }, { identifier: ['a', 'b'] }])(
		'rejects invalid selectors %j',
		async (query) => {
			await request(app).get('/api/type-metadata-preview').query(query).expect(400);
			expect(getTypeMetadataByIdentifier).not.toHaveBeenCalled();
		},
	);
	it('returns 404 for unknown metadata', async () => {
		await request(app).get('/api/type-metadata-preview?identifier=unknown').expect(404);
	});
	it('preserves the legacy SD-JWT VC preview', async () => {
		vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue({ vct: 'urn:example:pid' });
		await request(app).get('/api/vct-preview?vct=urn%3Aexample%3Apid').expect(200);
		expect(getTypeMetadataByIdentifier).toHaveBeenCalledWith(
			expect.anything(),
			'urn:example:pid',
			'dc+sd-jwt',
		);
	});
});
