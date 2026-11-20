import { Router } from 'express';
import { TypeMetadata } from 'wallet-common';
import { MsoMdocTypeMetadata, getMetadataId } from '../schemas/metadata';
import { db } from '../server';
import {
	createTypeMetadata,
	deleteTypeMetadataByIdentifier,
	getTypeMetadataByIdentifier,
	getTypeMetadataEntry,
	updateTypeMetadataByIdentifier,
} from '../db/typeMetadata';
import { parseIdentifier } from '../util';
import { config } from '../../config';
import { getMetadataPreviewDataUri } from '../util/metadataPreview';
import { verifyTypeMetadataUriIntegrity } from '../util/uriIntegrity';

/** Authenticated /api/type-metadata management routes. */
const typeMetadataManagementRouter = Router();

/** Public metadata retrieval is handled separately by /type-metadata. */

typeMetadataManagementRouter.get('/entry', async (req, res) => {
	const identifier = parseIdentifier(req.query.identifier);
	if (!identifier)
		return res.status(400).json({
			error: identifier === undefined ? 'missing_identifier' : 'invalid_identifier',
			message: 'A nonempty identifier string is required.',
		});
	const entry = await getTypeMetadataEntry(db, identifier);
	if (!entry)
		return res
			.status(404)
			.json({ error: 'unknown_identifier', message: 'Type metadata entry not found.' });
	res.json(entry);
});

typeMetadataManagementRouter.post('/create', async (req, res) => {
	const format = req.body.format;
	if (format !== 'dc+sd-jwt' && format !== 'mso_mdoc') {
		return res
			.status(400)
			.json({ error: 'invalid_format', message: 'Format must be dc+sd-jwt or mso_mdoc.' });
	}

	const identifier = parseIdentifier(req.body.identifier);

	if (identifier === undefined) {
		return res.status(400).json({
			error: 'missing_identifier',
			message: 'Body parameter "identifier" is required',
		});
	}

	if (identifier === null) {
		return res.status(400).json({
			error: 'invalid_identifier',
			message: 'Body parameter "identifier" must be a nonempty identifier string',
		});
	}

	const exists = await getTypeMetadataByIdentifier(db, identifier);
	if (exists) {
		return res.status(400).json({
			error: 'identifier_already_exists',
			message: `Type metadata with identifier "${identifier}" already exists.`,
		});
	}

	const metadata = req.body.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return res.status(400).json({
			error: 'missing_metadata',
			message: 'Body parameter "metadata" (object) is required',
		});
	}

	const validationResult = (format === 'mso_mdoc' ? MsoMdocTypeMetadata : TypeMetadata).safeParse(
		metadata,
	);
	if (!validationResult.success) {
		return res.status(400).json({
			error: 'invalid_metadata',
			message:
				'Type metadata validation failed. Errors: ' +
				JSON.stringify(validationResult.error),
		});
	}

	const parsedMetadata = validationResult.data;
	if (getMetadataId(parsedMetadata) !== identifier) {
		return res.status(400).json({
			error: 'identifier_mismatch',
			message: `Identifier in metadata ("${getMetadataId(parsedMetadata)}") does not match request identifier ("${identifier}"). It is not possible to change the type metadata identifier.`,
		});
	}

	const uriIntegrityResult = await verifyTypeMetadataUriIntegrity(parsedMetadata);
	if (!uriIntegrityResult.valid) {
		return res.status(400).json({
			error: 'uri_integrity_mismatch',
			message: `URI integrity verification failed: ${uriIntegrityResult.message}`,
		});
	}

	const contentSize = Buffer.byteLength(JSON.stringify(parsedMetadata));
	if (contentSize > config.max_metadata_size) {
		return res.status(413).json({
			error: 'metadata_too_large',
			message: `Type metadata JSON content is too large. Maximum allowed content size is ${config.max_metadata_size}B.`,
		});
	}

	const result = await createTypeMetadata(db, identifier, parsedMetadata, format);
	if (result !== 1) {
		return res.status(500).json({
			error: 'creation_failed',
			message: `Type metadata "${identifier}" could not be created.`,
		});
	}
	res.json({ message: 'Type metadata created successfully', data: result });
});

typeMetadataManagementRouter.post('/edit', async (req, res) => {
	const identifier = parseIdentifier(req.body.identifier);

	if (identifier === undefined) {
		return res.status(400).json({
			error: 'missing_identifier',
			message: 'Body parameter "identifier" is required',
		});
	}

	if (identifier === null) {
		return res.status(400).json({
			error: 'invalid_identifier',
			message: 'Body parameter "identifier" must be a nonempty identifier string',
		});
	}

	const entry = await getTypeMetadataEntry(db, identifier);
	if (!entry)
		return res
			.status(404)
			.json({ error: 'unknown_identifier', message: 'Type metadata entry not found.' });
	const format = entry.format;
	if (req.body.format !== undefined && req.body.format !== format) {
		return res
			.status(400)
			.json({ error: 'immutable_format', message: 'The metadata format cannot be changed.' });
	}

	const metadata = req.body.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return res.status(400).json({
			error: 'missing_metadata',
			message: 'Body parameter "metadata" (object) is required',
		});
	}

	const validationResult = (format === 'mso_mdoc' ? MsoMdocTypeMetadata : TypeMetadata).safeParse(
		metadata,
	);
	if (!validationResult.success) {
		return res.status(400).json({
			error: 'invalid_metadata',
			message:
				'Type metadata validation failed. Errors: ' +
				JSON.stringify(validationResult.error),
		});
	}
	const parsedMetadata = validationResult.data;
	if (getMetadataId(parsedMetadata) !== identifier) {
		return res.status(400).json({
			error: 'identifier_mismatch',
			message: `Identifier in metadata ("${getMetadataId(parsedMetadata)}") does not match request identifier ("${identifier}"). It is not possible to change the type metadata identifier.`,
		});
	}

	const contentSize = Buffer.byteLength(JSON.stringify(parsedMetadata));
	if (contentSize > config.max_metadata_size) {
		return res.status(413).json({
			error: 'metadata_too_large',
			message: `Type metadata JSON content is too large. Maximum allowed content size is ${config.max_metadata_size}B.`,
		});
	}

	const uriIntegrityResult = await verifyTypeMetadataUriIntegrity(parsedMetadata);
	if (!uriIntegrityResult.valid) {
		return res.status(400).json({
			error: 'uri_integrity_mismatch',
			message: `URI integrity verification failed: ${uriIntegrityResult.message}`,
		});
	}

	const result = await updateTypeMetadataByIdentifier(db, identifier, parsedMetadata);
	if (result === 0) {
		return res.status(404).json({
			error: 'unknown_identifier',
			message: `Type metadata with identifier "${identifier}" not found. Updating failed.`,
		});
	}

	if (result > 1) {
		return res.status(400).json({
			error: 'multiple_metadata_updated',
			message: `More than one type metadata entry with identifier "${identifier}" was found. All have been updated, which is unexpected.`,
		});
	}
	res.json({ message: 'Type metadata updated successfully', data: result });
});

typeMetadataManagementRouter.post('/delete', async (req, res) => {
	const identifier = parseIdentifier(req.body.identifier);

	if (identifier === undefined) {
		return res.status(400).json({
			error: 'missing_identifier',
			message: 'Body parameter "identifier" is required',
		});
	}

	if (identifier === null) {
		return res.status(400).json({
			error: 'invalid_identifier',
			message: 'Body parameter "identifier" must be a nonempty identifier string',
		});
	}

	const result = await deleteTypeMetadataByIdentifier(db, identifier);

	if (!result) {
		return res.status(404).json({
			error: 'unknown_identifier',
			message: `Type metadata with identifier "${identifier}" not found. Deleting failed.`,
		});
	}

	if (result > 1) {
		return res.status(400).json({
			error: 'multiple_metadata_deleted',
			message: `More than one type metadata entry with identifier "${identifier}" was found. All have been deleted, which is unexpected.`,
		});
	}
	res.json({ message: 'Type metadata deleted successfully' });
});

typeMetadataManagementRouter.post('/preview', async (req, res) => {
	const metadata = req.body?.metadata;

	if (!metadata || typeof metadata !== 'object') {
		return res.status(400).json({
			error: 'missing_metadata',
			message: 'Body parameter "metadata" (object) is required',
		});
	}

	try {
		const dataUri = await getMetadataPreviewDataUri(metadata);
		res.json({ dataUri });
	} catch (error) {
		return res.status(400).json({
			error: 'preview_generation_failed',
			message: error instanceof Error ? error.message : 'Failed to generate preview.',
		});
	}
});

export default typeMetadataManagementRouter;
