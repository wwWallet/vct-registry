import { Router } from 'express';
import { TypeMetadata } from 'wallet-common';
import { z } from 'zod';
import { MsoMdocTypeMetadata } from '../schemas/metadata';

const schemaRouter = Router();

schemaRouter.get('/:format', (req, res) => {
	const format = req.params.format;
	if (format !== 'dc+sd-jwt' && format !== 'mso_mdoc') {
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
