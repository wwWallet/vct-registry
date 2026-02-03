// src/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from '../config';
import { ALL_METADATA } from './registry';
import { basicAuth } from './middleware/auth';
import { typeMetadataSchema } from './schema/typeMetadataSchema';
import { TypeMetadata } from './schema/SdJwtVcTypeMetadataSchema';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// AJV Validation initialization
// ─────────────────────────────────────────────────────────────

const ajv = new Ajv2020({
	allErrors: true,
	strict: true,
	allowUnionTypes: true,
	useDefaults: true,
	coerceTypes: true
});
addFormats(ajv); // optional, for date, email, uri, etc.

// ─────────────────────────────────────────────────────────────
// Basic info endpoints
// ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

app.get('/api/info', (_req, res) => {
	res.json({
		name: 'vct-registry',
		version: '1.0.0',
		description: 'Express + TypeScript app for local VCT registry metadata.',
	});
});

app.get('/api/time', (_req, res) => {
	res.json({
		now: new Date().toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
});

// ─────────────────────────────────────────────────────────────
// VCT registry API (VCT-focused)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/vct
 * Returns a simple list of all VCTs + names.
 */
app.get('/api/vct', (_req, res) => {
	const list = ALL_METADATA.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
});

// ─────────────────────────────────────────────────────────────
// VCT API compatible with demo-issuer style (by vct)
// ─────────────────────────────────────────────────────────────

/**
 * GET /type-metadata?vct=urn:...
 * Returns the metadata object whose .vct matches the query.
 */
app.get('/type-metadata', (req, res) => {
	const rawVct = req.query.vct;

	if (!rawVct || typeof rawVct !== 'string') {
		return res.status(400).json({
			error: 'missing_vct',
			message: 'Query parameter "vct" is required',
		});
	}

	let decodedVct: string;
	try {
		decodedVct = decodeURIComponent(rawVct);
	} catch (_decodingError) {
		// fallback if decode fails
		decodedVct = rawVct;
	}
	const metadata = ALL_METADATA.find((m) => m.vct === decodedVct);

	if (!metadata) {
		return res.status(404).json({
			error: 'unknown_vct',
			message: `No metadata found for vct "${decodedVct}"`,
		});
	}

	res.json(metadata);
});

/**
 * GET /type-metadata/all
 * Returns an array of all metadata objects.
 */
app.get('/type-metadata/all', (_req, res) => {
	res.json(ALL_METADATA);
});

/**
 * GET /type-metadata/schema
 * Returns the JSON schema for type metadata.
 */
app.get('/type-metadata/schema', (_req, res) => {
	res.json(typeMetadataSchema);
});

// ─────────────────────────────────────────────────────────────
// Static frontend
// ─────────────────────────────────────────────────────────────

const publicPath = path.join(__dirname, '../public');

// 30-day immutable cache for images
app.use(
	'/images',
	express.static(path.join(publicPath, 'images'), {
		maxAge: '30d',
		immutable: true,
	})
);

// No caching for the rest of the UI (HTML, JS, CSS)
app.use(
	express.static(publicPath, {
		maxAge: 0,
	})
);

app.get('/', (_req, res) => {
	res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/edit', basicAuth, (_req, res) => {
	res.sendFile(path.join(publicPath, 'edit.html'));
});

// ─────────────────────────────────────────────────────────────
// Schema validation
// ─────────────────────────────────────────────────────────────

app.post('/edit', async (req, res) => {

	// zod validation
	const parsed = TypeMetadata.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error });
	}

	// ajv validation
	const validate = ajv.compile(typeMetadataSchema);
	const isValid = validate(req.body);
	if (!isValid) {
		return res.status(400).json({ errors: validate.errors });
	}

	const validData = parsed.data;
	// TODO vmarkop handle saving valid data
  	
  res.json({ message: 'Saved successfully', data: validData });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
	console.log(`✅ vct-registry server listening at http://localhost:${PORT}`);
});
