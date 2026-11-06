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

describe('API Authentication', () => {
	it('POST /vct/create returns 401 when not authenticated', async () => {
		await request(app).post('/vct/create').expect(401);
	});

	it('POST /vct/edit returns 401 when not authenticated', async () => {
		await request(app).post('/vct/edit').expect(401);
	});

	it('POST /vct/delete returns 401 when not authenticated', async () => {
		await request(app).post('/vct/delete').expect(401);
	});

	it('POST /vct/integrity returns detailed validation issues', async () => {
		const username = Object.keys(config.users)[0];
		const password = config.users[username];
		const agent = request.agent(app);

		await agent.get('/auth/login').auth(username, password).expect(200);
		const response = await agent
			.post('/vct/integrity')
			.send({ metadata: {} })
			.expect(400)
			.expect('Content-Type', /json/);

		expect(response.body).toMatchObject({
			error: 'invalid_metadata',
			message: expect.stringContaining('Metadata validation failed.'),
			issues: expect.arrayContaining([expect.stringMatching(/^vct: /)]),
		});
	});
});

describe('Non-authenticated endpoints (for conformance)', () => {
	it('GET /type-metadata/all returns 200 when not authenticated', async () => {
		await request(app).get('/type-metadata/all').expect(200);
	});
});
