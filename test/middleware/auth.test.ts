import { app } from '../../src/server';
import request from 'supertest';
import { config } from '../../config';
import { describe, it } from 'vitest';

describe('Session Authentication', () => {
	it('GET /auth returns 401 when not authenticated', async () => {
		await request(app).get('/auth').expect(401);
	});

	it('GET /auth/login returns 401 with wrong credentials', async () => {
		await request(app).get('/auth/login').auth('fake_user', 'wrong_password').expect(401);
	});

	it('login establishes a session that can be logged out', async () => {
		const username = Object.keys(config.users)[0];
		const password = config.users[username];
		const agent = request.agent(app);

		await agent.get('/auth/login').auth(username, password).expect(200);
		await agent.get('/auth').expect(200).expect({ username });
		await agent.get('/auth/logout').expect(200);
		await agent.get('/auth').expect(401);
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
