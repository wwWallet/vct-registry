import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllVctMetadata, getVctByUrn } from '../db/vct';
import { db } from '../server';
import { decodeVct, reverseList } from '../util';
import { getMetadataPreviewDataUri } from '../util/metadataPreview';

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
		description: 'Express + TypeScript app for local VCT registry metadata.',
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
 */
async function getVctList(_req: Request, res: Response) {
	const result = reverseList(await getAllVctMetadata(db));

	const list = result.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
}

apiRouter.get('/vct-list', getVctList);

apiRouter.get('/vct-preview', async (req, res) => {
	const vct = decodeVct(req.query.vct);
	if (!vct) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Query parameter "vct" must be a valid URI string',
		});
	}

	const metadata = await getVctByUrn(db, vct);
	if (!metadata) {
		return res.status(404).json({
			error: 'unknown_vct',
			message: `No metadata found for vct "${vct}"`,
		});
	}

	const dataUri = await getMetadataPreviewDataUri(metadata, {
		preferredProperties: { orientation: 'landscape' },
	});
	res.json({ dataUri });
});

export default apiRouter;
