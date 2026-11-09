import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/server';
import {
	getAllTypeMetadata,
	getTypeMetadataByIdentifier,
	getTypeMetadataList,
} from '../../src/db/typeMetadata';

vi.mock('../../src/db/typeMetadata', () => ({
	getAllTypeMetadata: vi.fn(),
	getTypeMetadataByIdentifier: vi.fn(),
	getTypeMetadataList: vi.fn(),
	getTypeMetadataEntry: vi.fn(),
	createTypeMetadata: vi.fn(),
	updateTypeMetadataByIdentifier: vi.fn(),
	deleteTypeMetadataByIdentifier: vi.fn(),
}));

const pid = { vct: 'urn:eudi:pid:1', name: 'PID' };
const diploma = { vct: 'urn:credential:diploma', name: 'Diploma' };

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(getAllTypeMetadata).mockResolvedValue([pid, diploma]);
	vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(pid);
});

describe('documented legacy registry API compatibility', () => {
	it('returns the raw metadata array without authentication', async () => {
		const { body } = await request(app).get('/type-metadata/all').expect(200);
		expect(body).toEqual([pid, diploma]);
	});

	it.each([pid.vct, encodeURIComponent(pid.vct)])(
		'returns the raw metadata document for vct=%s, including browser CORS access',
		async (vct) => {
			const response = await request(app)
				.get(`/type-metadata?vct=${vct}`)
				.set('Origin', 'https://wallet.example.org')
				.expect(200)
				.expect('Content-Type', /json/)
				.expect('Access-Control-Allow-Origin', '*');
			expect(response.body).toEqual(pid);
			expect(getTypeMetadataByIdentifier).toHaveBeenCalledWith(
				expect.anything(),
				pid.vct,
				'dc+sd-jwt',
			);
		},
	);

	it('preserves the VCT list response fields and reverse ordering', async () => {
		const { body } = await request(app).get('/api/vct-list').expect(200);
		expect(body).toEqual([diploma, pid]);
	});

	it.each(['get', 'head'] as const)(
		'advertises deprecation on %s for browser and HTTP clients',
		async (method) => {
			const response = await request(app)
				[method]('/api/vct-list')
				.set('Origin', 'https://wallet.example.org')
				.expect(200);
			expect(response.headers.deprecation).toBe('@1793491200');
			expect(
				new Date(Number(response.headers.deprecation.slice(1)) * 1000).toISOString(),
			).toBe('2026-11-01T00:00:00.000Z');
			expect(response.headers.link).toContain(
				'<../usage#type-metadata-list>; rel="deprecation"; type="text/html"',
			);
			expect(response.headers.link).toContain(
				'<../type-metadata/list>; rel="successor-version"',
			);
			expect(response.headers['access-control-expose-headers']).toBe('Deprecation, Link');
			expect(response.headers.sunset).toBeUndefined();
		},
	);

	it('does not mark the replacement list as deprecated', async () => {
		vi.mocked(getTypeMetadataList).mockResolvedValue([]);
		const response = await request(app).get('/type-metadata/list').expect(200);
		expect(response.headers.deprecation).toBeUndefined();
		expect(response.headers.link).toBeUndefined();
	});

	it('reports all accepted identifier selectors when missing and preserves unknown VCT errors', async () => {
		const missing = await request(app).get('/type-metadata').expect(400);
		expect(missing.body.error).toBe('missing_identifier');
		expect(missing.body.message).toBe(
			'One of the query parameters "identifier", "id", or "vct" is required',
		);
		vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(undefined);
		const unknown = await request(app).get('/type-metadata?vct=urn:unknown').expect(404);
		expect(unknown.body.error).toBe('unknown_vct');
	});

	it('keeps the original schema endpoint as an alias for the SD-JWT VC schema', async () => {
		const legacy = await request(app).get('/type-metadata/schema').expect(200);
		const explicit = await request(app).get('/type-metadata/schema/dc+sd-jwt').expect(200);
		expect(legacy.body).toEqual(explicit.body);
	});
});

describe('format-neutral registry lookups', () => {
	it.each([
		[{ identifier: pid.vct }, undefined],
		[{ id: pid.vct }, undefined],
		[{ identifier: pid.vct, format: 'dc+sd-jwt' }, 'dc+sd-jwt'],
		[{ identifier: pid.vct, id: pid.vct, vct: pid.vct }, 'dc+sd-jwt'],
	] as const)('resolves %j with the expected format constraint', async (query, format) => {
		const { body } = await request(app).get('/type-metadata').query(query).expect(200);
		expect(body).toEqual(pid);
		expect(getTypeMetadataByIdentifier).toHaveBeenCalledWith(
			expect.anything(),
			pid.vct,
			format,
		);
	});

	it.each([
		{ identifier: '' },
		{ id: ' ' },
		{ id: ['a', 'a'] },
		{ identifier: 'a', format: 'unsupported-format' },
		{ identifier: 'a', id: 'b' },
		{ id: 'a', vct: 'b' },
		{ id: 'a', format: ['dc+sd-jwt', 'dc+sd-jwt'] },
	])('rejects invalid or conflicting selectors %j', async (query) => {
		await request(app).get('/type-metadata').query(query).expect(400);
		expect(getTypeMetadataByIdentifier).not.toHaveBeenCalled();
	});

	it('filters collections by the requested format', async () => {
		const { body } = await request(app)
			.get('/type-metadata/all')
			.query({ format: 'dc+sd-jwt' })
			.expect(200);
		expect(body).toEqual([pid, diploma]);
		expect(getAllTypeMetadata).toHaveBeenCalledWith(expect.anything(), 'dc+sd-jwt');
	});

	it.each(['', 'unsupported-format', ['dc+sd-jwt', 'dc+sd-jwt']])(
		'rejects invalid collection format %j',
		async (format) => {
			await request(app).get('/type-metadata/all').query({ format }).expect(400);
			expect(getAllTypeMetadata).not.toHaveBeenCalled();
		},
	);

	it('lists explicit identifiers and stored formats', async () => {
		const entries = [
			{ identifier: pid.vct, format: 'dc+sd-jwt' as const, name: pid.name },
			{ identifier: diploma.vct, format: 'dc+sd-jwt' as const, name: diploma.name },
		];
		vi.mocked(getTypeMetadataList).mockResolvedValue(entries);
		const { body } = await request(app).get('/type-metadata/list').expect(200);
		expect(body).toEqual([...entries].reverse());
	});
});
