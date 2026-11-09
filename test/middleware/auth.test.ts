import { app } from '../../src/server';
import request from 'supertest';
import { config } from '../../config';
import { describe, expect, it } from 'vitest';

describe('Frontend Authentication', () => {
	it('GET /edit redirects to the configured URL when not authenticated', async () => {
		await request(app).get('/edit').expect(302).expect('Location', config.url);
	});

	it('GET /edit redirects to the configured URL with wrong credentials', async () => {
		await request(app)
			.get('/edit')
			.auth('fake_user', 'wrong_password')
			.expect(302)
			.expect('Location', config.url);
	});

	it('GET /edit returns 200 when authenticated properly', async () => {
		const username = Object.keys(config.users)[0];
		const password = config.users[username];

		const agent = request.agent(app);

		await agent.get('/auth/login').auth(username, password).expect(200);

		const edit = await agent.get('/edit').expect(200);
		expect(edit.text).not.toContain('<select');
		expect(edit.text).toContain('id="edit-metadata-format-value"');
		const add = await agent.get('/add').expect(200);
		expect(add.text).not.toContain('<select');
		expect(add.text).toContain('<code>dc+sd-jwt</code>');
	});
});

describe.each(['/api/type-metadata'])('API Authentication at %s', (prefix) => {
	it('rejects entry lookup without a session', async () => {
		await request(app).get(`${prefix}/entry?identifier=urn:example:test`).expect(401);
	});

	it.each(['create', 'edit', 'delete', 'preview'])(
		'rejects %s without a session',
		async (operation) => {
			await request(app).post(`${prefix}/${operation}`).expect(401);
		},
	);
});

describe('Non-authenticated endpoints (for conformance)', () => {
	it.each(['entry', 'create', 'edit', 'delete', 'preview'])(
		'does not expose the removed /vct/%s management alias',
		async (operation) => {
			if (operation === 'entry') {
				await request(app).get(`/vct/${operation}`).expect(404);
			} else {
				await request(app).post(`/vct/${operation}`).expect(404);
			}
		},
	);

	it('GET /type-metadata/all returns 200 when not authenticated', async () => {
		await request(app).get('/type-metadata/all').expect(200);
	});
});
