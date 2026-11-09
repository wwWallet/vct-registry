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
			'One of the query parameters "identifier", "id", "vct", or "doctype" is required',
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

const mdoc = { doctype: 'org.example.document', name: 'Mdoc' };

describe('format-neutral registry lookups', () => {
	it.each([
		[{ vct: pid.vct }, pid.vct, 'dc+sd-jwt'],
		[{ doctype: mdoc.doctype }, mdoc.doctype, 'mso_mdoc'],
		[{ identifier: mdoc.doctype }, mdoc.doctype, undefined],
		[{ id: mdoc.doctype }, mdoc.doctype, undefined],
		[{ identifier: pid.vct, format: 'dc+sd-jwt' }, pid.vct, 'dc+sd-jwt'],
		[{ id: mdoc.doctype, format: 'mso_mdoc' }, mdoc.doctype, 'mso_mdoc'],
		[{ identifier: pid.vct, id: pid.vct, vct: pid.vct }, pid.vct, 'dc+sd-jwt'],
	] as const)(
		'resolves %j with the expected format constraint',
		async (query, identifier, format) => {
			vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(
				format === 'dc+sd-jwt' ? pid : mdoc,
			);
			const { body } = await request(app).get('/type-metadata').query(query).expect(200);
			expect(getTypeMetadataByIdentifier).toHaveBeenCalledWith(
				expect.anything(),
				identifier,
				format,
			);
			expect(body).toEqual(format === 'dc+sd-jwt' ? pid : mdoc);
		},
	);

	it.each([
		{ identifier: '' },
		{ id: ' ' },
		{ doctype: ['a', 'b'] },
		{ id: ['a', 'a'] },
		{ identifier: 'a', format: 'mdoc' },
		{ identifier: 'a', id: 'b' },
		{ id: 'a', vct: 'b' },
		{ vct: 'a', doctype: 'a' },
		{ vct: 'a', format: 'mso_mdoc' },
		{ doctype: 'a', format: 'dc+sd-jwt' },
		{ id: 'a', format: ['mso_mdoc', 'dc+sd-jwt'] },
	])('rejects invalid or conflicting selectors %j', async (query) => {
		await request(app).get('/type-metadata').query(query).expect(400);
		expect(getTypeMetadataByIdentifier).not.toHaveBeenCalled();
	});

	it('returns 404 when the identifier and format do not match an entry', async () => {
		vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(undefined);
		const { body } = await request(app)
			.get('/type-metadata')
			.query({ id: pid.vct, format: 'mso_mdoc' })
			.expect(404);
		expect(body.error).toBe('unknown_identifier');
	});

	it.each(['dc+sd-jwt', 'mso_mdoc'] as const)('filters /all by %s', async (format) => {
		const metadata = format === 'mso_mdoc' ? mdoc : pid;
		vi.mocked(getAllTypeMetadata).mockResolvedValue([metadata]);
		const { body } = await request(app).get('/type-metadata/all').query({ format }).expect(200);
		expect(body).toEqual([metadata]);
		expect(getAllTypeMetadata).toHaveBeenCalledWith(expect.anything(), format);
	});

	it('returns an empty array for a format with no entries', async () => {
		vi.mocked(getAllTypeMetadata).mockResolvedValue([]);
		const { body } = await request(app).get('/type-metadata/all?format=mso_mdoc').expect(200);
		expect(body).toEqual([]);
	});

	it.each(['', 'mdoc', 'sdjwt', 'other', ['mso_mdoc', 'dc+sd-jwt']])(
		'rejects invalid /all format %j',
		async (format) => {
			const { body } = await request(app)
				.get('/type-metadata/all')
				.query({ format })
				.expect(400);
			expect(body.error).toBe('invalid_format');
			expect(getAllTypeMetadata).not.toHaveBeenCalled();
		},
	);

	it('returns documents from both formats in /all', async () => {
		vi.mocked(getAllTypeMetadata).mockResolvedValue([pid, mdoc]);
		const { body } = await request(app).get('/type-metadata/all').expect(200);
		expect(body).toEqual([pid, mdoc]);
	});

	it('lists all formats using explicit identifiers and stored formats', async () => {
		const entries = [
			{ identifier: pid.vct, format: 'dc+sd-jwt' as const, name: pid.name },
			{ identifier: mdoc.doctype, format: 'mso_mdoc' as const, name: mdoc.name },
		];
		vi.mocked(getTypeMetadataList).mockResolvedValue(entries);
		const { body } = await request(app).get('/type-metadata/list').expect(200);
		expect(body).toEqual([...entries].reverse());
	});

	it('keeps mdocs out of the deprecated VCT list', async () => {
		vi.mocked(getAllTypeMetadata).mockResolvedValue([pid, mdoc, diploma]);
		const { body } = await request(app).get('/api/vct-list').expect(200);
		expect(body).toEqual([diploma, pid]);
	});
});
