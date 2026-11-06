import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';

export function registerReactFrontend(targetApp: Express, publicPath: string): boolean {
	const reactPath = path.join(publicPath, 'react');
	const reactIndexPath = path.join(reactPath, 'index.html');
	if (!fs.existsSync(reactIndexPath)) return false;

	targetApp.use(
		'/assets',
		express.static(path.join(reactPath, 'assets'), {
			maxAge: '1y',
			immutable: true,
		}),
	);
	targetApp.use(
		express.static(reactPath, {
			index: false,
			maxAge: 0,
		}),
	);

	targetApp.use((req, res, next) => {
		const backendPath = ['/api', '/auth', '/type-metadata', '/vct', '/images', '/assets'].some(
			(prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
		);
		if (req.method !== 'GET' || backendPath || !req.accepts('html')) return next();

		res.setHeader('Cache-Control', 'no-store');
		return res.sendFile(reactIndexPath);
	});

	return true;
}
