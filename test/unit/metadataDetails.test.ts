import express from 'express';
import cookieParser from 'cookie-parser';
import nunjucks from 'nunjucks';
import path from 'path';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import viewsRouter from '../../src/routes/views';
import { getAllTypeMetadata, getTypeMetadataEntry } from '../../src/db/typeMetadata';

vi.mock('../../src/server', () => ({ db: {} }));
vi.mock('../../src/db/typeMetadata', () => ({
	getAllTypeMetadata: vi.fn(),
	getTypeMetadataEntry: vi.fn(),
}));

const app = express();
app.use(cookieParser());
nunjucks.configure(path.resolve('src/views'), { autoescape: true, express: app });
app.set('view engine', 'njk');
app.use(viewsRouter);

beforeEach(() => vi.resetAllMocks());

describe('metadata details', () => {
	it.each(['identifier', 'id', 'vct'])(
		'accepts the %s page selector and generates identifier links',
		async (key) => {
			const identifier = 'org.example.document';
			const metadata = { vct: identifier };
			vi.mocked(getAllTypeMetadata).mockResolvedValue([metadata]);
			vi.mocked(getTypeMetadataEntry).mockResolvedValue({ format: 'dc+sd-jwt', metadata });
			const { text } = await request(app)
				.get('/metadata')
				.query({ [key]: identifier })
				.expect(200);
			expect(text).toContain('name="identifier"');
			expect(text).toContain(`<code id="metadata-identifier-value">${identifier}</code>`);
			expect(text).toContain('/type-metadata?identifier=org.example.document');
		},
	);

	it.each(['dc+sd-jwt'] as const)(
		'displays the stored %s format before the VCT',
		async (format) => {
			const identifier = 'org.example.document';
			const metadata = { vct: identifier };
			vi.mocked(getAllTypeMetadata).mockResolvedValue([metadata]);
			vi.mocked(getTypeMetadataEntry).mockResolvedValue({ format, metadata });

			const { text } = await request(app)
				.get('/metadata')
				.query({ vct: identifier })
				.expect(200);
			expect(getTypeMetadataEntry).toHaveBeenCalledWith(expect.anything(), identifier);
			expect(text).toContain(`<code id="metadata-format-value">${format}</code>`);
			expect(text).toContain(`/type-metadata?identifier=${encodeURIComponent(identifier)}`);
			expect(text).not.toContain('/type-metadata?vct=');
			expect(text.indexOf('id="metadata-format-value"')).toBeLessThan(
				text.indexOf('id="metadata-identifier-value"'),
			);
		},
	);

	it('does not display a single format for the complete registry response', async () => {
		vi.mocked(getAllTypeMetadata).mockResolvedValue([{ vct: 'urn:example:test' }]);
		const { text } = await request(app).get('/metadata').expect(200);
		expect(text).not.toContain('id="metadata-format-value"');
		expect(getTypeMetadataEntry).not.toHaveBeenCalled();
	});
});
