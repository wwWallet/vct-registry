import { Router } from 'express';
import { TypeMetadata } from 'wallet-common';
import { z } from 'zod';

const schemaRouter = Router();

schemaRouter.get('/:format', (req, res) => {
	const format = req.params.format;
	if (format !== 'dc+sd-jwt') {
		return res.status(400).json({
			error: 'invalid_format',
			message: 'Format must be dc+sd-jwt.',
		});
	}

	const schema = z.toJSONSchema(TypeMetadata, {
		target: 'draft-07',
		io: 'output',
	});
	delete schema.$schema;
	res.json(schema);
});

export default schemaRouter;
