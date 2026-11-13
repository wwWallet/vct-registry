import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllTypeMetadata } from '../db/typeMetadata';
import { db } from '../server';
import { reverseList } from '../util';

/** /api */
const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

apiRouter.get('/info', (_req, res) => {
	res.json({
		name: 'vct-registry',
		version: '1.0.0',
		description: 'Express + TypeScript registry for verifiable credential type metadata.',
	});
});

apiRouter.get('/time', (_req, res) => {
	res.json({
		now: new Date().toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
});

/**
 * Returns a simple list of all VCTs + names.
 * @deprecated Use GET /type-metadata/list for all formats.
 */
async function getVctList(_req: Request, res: Response) {
	// RFC 9745 Structured Field Date: deprecated since 2026-11-01T00:00:00Z.
	res.setHeader('Deprecation', '@1793491200');
	res.append('Link', '<../usage#type-metadata-list>; rel="deprecation"; type="text/html"');
	res.append('Link', '<../type-metadata/list>; rel="successor-version"');
	res.append('Access-Control-Expose-Headers', 'Deprecation, Link');
	const result = reverseList(await getAllTypeMetadata(db));

	const list = result
		.filter((meta) => 'vct' in meta)
		.map((meta) => ({
			vct: meta.vct,
			name: meta.name,
		}));

	res.json(list);
}

apiRouter.get('/vct-list', getVctList);

export default apiRouter;
