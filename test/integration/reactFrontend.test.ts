import express, { type Express } from 'express';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerReactFrontend } from '../../src/reactFrontend';

describe('Production React frontend', () => {
	const indexHtml = '<!doctype html><html><body><div id="root">VCT Registry</div></body></html>';
	let publicPath: string;
	let testApp: Express;

	beforeAll(async () => {
		publicPath = await fs.mkdtemp(path.join(os.tmpdir(), 'vct-registry-react-'));
		const reactPath = path.join(publicPath, 'react');
		await fs.mkdir(path.join(reactPath, 'assets'), { recursive: true });
		await fs.writeFile(path.join(reactPath, 'index.html'), indexHtml);
		await fs.writeFile(path.join(reactPath, 'assets', 'app-abc123.js'), 'console.log("ok");');

		testApp = express();
		testApp.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
		expect(registerReactFrontend(testApp, publicPath)).toBe(true);
	});

	afterAll(async () => {
		await fs.rm(publicPath, { recursive: true, force: true });
	});

	it.each(['/', '/metadata'])('serves index.html for React route %s', async (route) => {
		const response = await request(testApp).get(route).set('Accept', 'text/html').expect(200);

		expect(response.text).toBe(indexHtml);
		expect(response.headers['cache-control']).toBe('no-store');
	});

	it('preserves backend routes', async () => {
		await request(testApp)
			.get('/api/health')
			.set('Accept', 'text/html')
			.expect(200)
			.expect('Content-Type', /json/)
			.expect({ status: 'ok' });
	});

	it('serves hashed assets with immutable caching', async () => {
		const response = await request(testApp).get('/assets/app-abc123.js').expect(200);

		expect(response.headers['cache-control']).toContain('max-age=31536000');
		expect(response.headers['cache-control']).toContain('immutable');
	});

	it('returns 404 for missing assets instead of index.html', async () => {
		const response = await request(testApp)
			.get('/assets/missing.js')
			.set('Accept', '*/*')
			.expect(404);

		expect(response.text).not.toContain(indexHtml);
	});
});
