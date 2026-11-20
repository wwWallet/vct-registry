import { Router } from 'express';
import { parseIdentifier, reverseList } from '../util';
import { parseMetadataFormat } from '../schemas/metadata';
import {
	getAllTypeMetadata,
	getTypeMetadataByIdentifier,
	getTypeMetadataList,
} from '../db/typeMetadata';
import { db } from '../server';
import { TypeMetadata } from 'wallet-common';
import { z } from 'zod';
import schemaRouter from './schema';

/** /type-metadata */
const typeMetadataRouter = Router();
typeMetadataRouter.use('/schema', schemaRouter);

/** Retrieve one raw metadata document using a generic or format-specific identifier. */
typeMetadataRouter.get('/', async (req, res) => {
	const selectors = ['identifier', 'id', 'vct', 'doctype'] as const;
	const supplied = selectors.filter((key) => req.query[key] !== undefined);
	const identifiers = supplied.map((key) => parseIdentifier(req.query[key]));
	const legacy = supplied.length === 1 && supplied[0] === 'vct';
	if (supplied.length === 0 || (legacy && identifiers[0] === undefined)) {
		return res.status(400).json({
			error: 'missing_identifier',
			message:
				'One of the query parameters "identifier", "id", "vct", or "doctype" is required',
		});
	}

	if (identifiers.some((value) => typeof value !== 'string')) {
		return res.status(400).json({
			error: legacy ? 'invalid_vct' : 'invalid_identifier',
			message: legacy
				? 'Query parameter "vct" must be a valid URI string'
				: 'Identifiers must be nonempty strings.',
		});
	}
	if (
		new Set(identifiers).size !== 1 ||
		(supplied.includes('vct') && supplied.includes('doctype'))
	) {
		return res.status(400).json({
			error: 'conflicting_query',
			message: 'Identifier selectors must agree and cannot combine vct and doctype.',
		});
	}
	const identifier = identifiers[0] as string;
	const requestedFormat = parseMetadataFormat(req.query.format);
	if (req.query.format !== undefined && requestedFormat === undefined) {
		return res
			.status(400)
			.json({ error: 'invalid_format', message: 'Format must be dc+sd-jwt or mso_mdoc.' });
	}
	const impliedFormat = supplied.includes('vct')
		? 'dc+sd-jwt'
		: supplied.includes('doctype')
			? 'mso_mdoc'
			: undefined;
	if (impliedFormat && requestedFormat !== undefined && requestedFormat !== impliedFormat) {
		return res.status(400).json({
			error: 'conflicting_query',
			message: 'The format conflicts with the identifier selector.',
		});
	}
	const format = impliedFormat ?? requestedFormat;
	const metadata = await getTypeMetadataByIdentifier(db, identifier, format);
	if (!metadata) {
		return res.status(404).json({
			error: legacy ? 'unknown_vct' : 'unknown_identifier',
			message: legacy
				? `No metadata found for vct "${identifier}"`
				: `No metadata found for identifier "${identifier}"`,
		});
	}
	res.json(metadata);
});

/** List identifiers, formats, and names for all registered metadata. */
typeMetadataRouter.get('/list', async (_req, res) => {
	res.json(reverseList(await getTypeMetadataList(db)));
});

/**
 * GET /type-metadata/all
 * Returns an array of all metadata objects.
 */
typeMetadataRouter.get('/all', async (req, res) => {
	const format = parseMetadataFormat(req.query.format);
	if (req.query.format !== undefined && format === undefined) {
		return res
			.status(400)
			.json({ error: 'invalid_format', message: 'Format must be dc+sd-jwt or mso_mdoc.' });
	}
	res.json(
		format === undefined ? await getAllTypeMetadata(db) : await getAllTypeMetadata(db, format),
	);
});

/**
 * GET /type-metadata/schema
 * Returns the JSON schema for type metadata,
 * based on the Zod schema defined in wallet-common.
 */
typeMetadataRouter.get('/schema', (_req, res) => {
	const typeMetadataSchema = z.toJSONSchema(TypeMetadata, {
		target: 'draft-07',
		io: 'output',
	});
	delete typeMetadataSchema.$schema;

	res.json(typeMetadataSchema);
});

export default typeMetadataRouter;
