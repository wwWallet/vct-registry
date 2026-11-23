import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/server';
import { config } from '../../config';
import {
	createTypeMetadata,
	deleteTypeMetadataByIdentifier,
	getTypeMetadataByIdentifier,
	getTypeMetadataEntry,
	updateTypeMetadataByIdentifier,
} from '../../src/db/typeMetadata';

vi.mock('../../src/db/typeMetadata', () => ({
	getAllTypeMetadata: vi.fn(),
	getTypeMetadataList: vi.fn(),
	getTypeMetadataByIdentifier: vi.fn(),
	getTypeMetadataEntry: vi.fn(),
	createTypeMetadata: vi.fn(),
	updateTypeMetadataByIdentifier: vi.fn(),
	deleteTypeMetadataByIdentifier: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

describe.each(['/api/type-metadata'])('authenticated management at %s', (prefix) => {
	it.each(
		(['dc+sd-jwt', 'mso_mdoc'] as const).flatMap((format) =>
			[
				'org.example.document',
				'https://example.org/types/a%2Fb',
				'org.example.%25.document',
				'org.example.100%',
				' org.example.document ',
			].map((identifier) => ({ format, identifier })),
		),
	)(
		'preserves $identifier through lookup and writes for $format',
		async ({ format, identifier }) => {
			const metadata = format === 'mso_mdoc' ? { doctype: identifier } : { vct: identifier };
			const entry = { format, metadata };
			vi.mocked(getTypeMetadataByIdentifier).mockResolvedValue(undefined);
			vi.mocked(getTypeMetadataEntry).mockResolvedValue(entry);
			vi.mocked(createTypeMetadata).mockResolvedValue(1);
			vi.mocked(updateTypeMetadataByIdentifier).mockResolvedValue(1);
			vi.mocked(deleteTypeMetadataByIdentifier).mockResolvedValue(1);
			const username = Object.keys(config.users)[0];
			const agent = request.agent(app);
			await agent.get('/auth/login').auth(username, config.users[username]).expect(200);

			const response = await agent.get(`${prefix}/entry`).query({ identifier }).expect(200);
			expect(response.body).toEqual(entry);
			expect(getTypeMetadataEntry).toHaveBeenCalledWith(expect.anything(), identifier);
			await agent
				.post(`${prefix}/create`)
				.send({ identifier: identifier, format, metadata })
				.expect(200);
			expect(createTypeMetadata).toHaveBeenCalledWith(
				expect.anything(),
				identifier,
				metadata,
				format,
			);
			await agent
				.post(`${prefix}/edit`)
				.send({ identifier: identifier, format, metadata })
				.expect(200);
			expect(updateTypeMetadataByIdentifier).toHaveBeenCalledWith(
				expect.anything(),
				identifier,
				metadata,
			);
			await agent
				.post(`${prefix}/delete`)
				.send({ identifier: identifier })
				.expect(200)
				.expect({ message: 'Type metadata deleted successfully' });
			expect(deleteTypeMetadataByIdentifier).toHaveBeenCalledWith(
				expect.anything(),
				identifier,
			);
		},
	);

	it('routes preview requests through session authentication and payload validation', async () => {
		const username = Object.keys(config.users)[0];
		const agent = request.agent(app);
		await agent.get('/auth/login').auth(username, config.users[username]).expect(200);
		const { body } = await agent.post(`${prefix}/preview`).send({}).expect(400);
		expect(body.error).toBe('missing_metadata');
	});
});
