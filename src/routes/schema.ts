import { Router } from 'express';
import { TypeMetadata } from 'wallet-common';
import { z } from 'zod';
import { MsoMdocTypeMetadata, parseMetadataFormat } from '../schemas/metadata';

const schemaRouter = Router();

schemaRouter.get('/:format', (req, res) => {
	const format = parseMetadataFormat(req.params.format);
	if (format === undefined) {
		return res.status(400).json({
			error: 'invalid_format',
			message: 'Format must be dc+sd-jwt or mso_mdoc.',
		});
	}

	const schema = z.toJSONSchema(format === 'mso_mdoc' ? MsoMdocTypeMetadata : TypeMetadata, {
		target: 'draft-07',
		io: 'output',
	});
	delete schema.$schema;
	res.json(schema);
});

export default schemaRouter;
