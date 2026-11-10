import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllTypeMetadata, getTypeMetadataByIdentifier } from '../db/typeMetadata';
import { db } from '../server';
import { decodeIdentifier, reverseList } from '../util';
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

apiRouter.get('/type-metadata-preview', async (req, res) => {
	const identifier = req.query.identifier;
	if (typeof identifier !== 'string' || !identifier.trim()) {
		return res.status(400).json({
			error: 'invalid_identifier',
			message: 'A nonempty identifier string is required.',
		});
	}
	const metadata = await getTypeMetadataByIdentifier(db, identifier);
	if (!metadata) {
		return res
			.status(404)
			.json({ error: 'unknown_identifier', message: 'Type metadata entry not found.' });
	}
	const dataUri = await getMetadataPreviewDataUri(metadata, {
		preferredProperties: { orientation: 'landscape' },
	});
	res.json({ dataUri });
});

apiRouter.get('/vct-preview', async (req, res) => {
	const vct = decodeIdentifier(req.query.vct);
	if (!vct) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Query parameter "vct" must be a valid URI string',
		});
	}

	const metadata = await getTypeMetadataByIdentifier(db, vct, 'dc+sd-jwt');
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
