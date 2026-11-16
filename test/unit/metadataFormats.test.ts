import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import typeMetadataManagementRouter from '../../src/routes/typeMetadataManagement';
import typeMetadataRouter from '../../src/routes/typeMetadata';
import {
	createTypeMetadata,
	getTypeMetadataByIdentifier,
	getTypeMetadataEntry,
	updateTypeMetadataByIdentifier,
} from '../../src/db/typeMetadata';

vi.mock('../../src/server', () => ({ db: {} }));

vi.mock('../../src/db/typeMetadata', () => ({
	createTypeMetadata: vi.fn(),
	getTypeMetadataByIdentifier: vi.fn(),
	getTypeMetadataEntry: vi.fn(),
	updateTypeMetadataByIdentifier: vi.fn(),
	deleteTypeMetadataByIdentifier: vi.fn(),
	getAllTypeMetadata: vi.fn().mockResolvedValue([]),
}));

const app = express();
app.use(express.json());
app.use('/api/type-metadata', typeMetadataManagementRouter);
app.use('/type-metadata', typeMetadataRouter);

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(undefined);
	vi.mocked(createTypeMetadata).mockResolvedValue(1);
	vi.mocked(updateTypeMetadataByIdentifier).mockResolvedValue(1);
	vi.mocked(getTypeMetadataEntry).mockResolvedValue({
		format: 'dc+sd-jwt',
		metadata: { vct: 'org.example.document' },
	});
});

describe('Metadata formats', () => {
	it.each(['create', 'edit', 'delete'])(
		'uses generic identifier errors for %s',
		async (operation) => {
			const missing = await request(app)
				.post(`/api/type-metadata/${operation}`)
				.send({ format: 'dc+sd-jwt' })
				.expect(400);
			expect(missing.body.error).toBe('missing_identifier');
			const invalid = await request(app)
				.post(`/api/type-metadata/${operation}`)
				.send({ identifier: ['bad'], format: 'dc+sd-jwt' })
				.expect(400);
			expect(invalid.body.error).toBe('invalid_identifier');
		},
	);

	it('uses generic lookup errors', async () => {
		const missing = await request(app).get('/api/type-metadata/entry').expect(400);
		expect(missing.body.error).toBe('missing_identifier');
		vi.mocked(getTypeMetadataEntry).mockResolvedValue(undefined);
		const unknown = await request(app)
			.get('/api/type-metadata/entry?identifier=unknown')
			.expect(404);
		expect(unknown.body.error).toBe('unknown_identifier');
	});

	it('uses a generic duplicate identifier error', async () => {
		vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue({ vct: 'existing' });
		const { body } = await request(app)
			.post('/api/type-metadata/create')
			.send({ identifier: 'existing', format: 'dc+sd-jwt' })
			.expect(400);
		expect(body.error).toBe('identifier_already_exists');
	});

	it('uses a generic identifier mismatch error', async () => {
		const { body } = await request(app)
			.post('/api/type-metadata/edit')
			.send({ identifier: 'org.example.document', metadata: { vct: 'different' } })
			.expect(400);
		expect(body.error).toBe('identifier_mismatch');
	});

	it.each(['create', 'edit', 'preview'])(
		'uses a generic missing metadata error for %s',
		async (operation) => {
			const { body } = await request(app)
				.post(`/api/type-metadata/${operation}`)
				.send({ identifier: 'org.example.document', format: 'dc+sd-jwt' })
				.expect(400);
			expect(body.error).toBe('missing_metadata');
		},
	);

	it.each(['sdjwt', 'mdoc', 'unknown', 'constructor', 'toString'])(
		'rejects unsupported schema format %s',
		async (format) => {
			const { body } = await request(app).get(`/type-metadata/schema/${format}`).expect(400);
			expect(body.error).toBe('invalid_format');
		},
	);

	it.each(['dc+sd-jwt'] as const)('creates and persists %s metadata', async (format) => {
		const id = 'org.example.document';
		const metadata = { vct: id };
		await request(app)
			.post('/api/type-metadata/create')
			.send({ identifier: id, format, metadata })
			.expect(200);
		expect(createTypeMetadata).toHaveBeenCalledWith(expect.anything(), id, metadata, format);
	});

	it('requires an explicit format on create', async () => {
		const metadata = { vct: 'urn:example:test' };
		const { body } = await request(app)
			.post('/api/type-metadata/create')
			.send({ identifier: metadata.vct, metadata })
			.expect(400);
		expect(body.error).toBe('invalid_format');
		expect(createTypeMetadata).not.toHaveBeenCalled();
	});

	it.each(['other', 'sdjwt', 'mdoc'])('rejects unsupported format %s', async (format) => {
		await request(app).post('/api/type-metadata/create').send({ format }).expect(400);
		expect(createTypeMetadata).not.toHaveBeenCalled();
	});

	it('loads the stored format alongside metadata for editing', async () => {
		const { body } = await request(app)
			.get('/api/type-metadata/entry?identifier=org.example.document')
			.expect(200);
		expect(body).toEqual({ format: 'dc+sd-jwt', metadata: { vct: 'org.example.document' } });
	});

	it('rejects a format change on edit', async () => {
		await request(app)
			.post('/api/type-metadata/edit')
			.send({
				identifier: 'org.example.document',
				format: 'unsupported-format',
				metadata: { vct: 'org.example.document' },
			})
			.expect(400);
		expect(updateTypeMetadataByIdentifier).not.toHaveBeenCalled();
	});
});
