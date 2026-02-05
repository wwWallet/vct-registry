// src/server.ts
import express from "express";
import cors from "cors";
import path from "path";
import { config } from "../config";
import knexConfig from "../knexfile";
import { basicAuth } from "./middleware/auth";
import { typeMetadataSchema } from "./schema/typeMetadataSchema";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { knex } from "knex";
import { getAllVctMetadata, initVctTable } from "./db/vct";
import apiRouter from "./routes/api";
import typeMetadataRouter from "./routes/typeMetadata";
import dbVctRouter from "./routes/db";

export const app = express();
const PORT = config.port;

// ─────────────────────────────────────────────────────────────
// Middleware initialization
// ─────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Database initialization
// ─────────────────────────────────────────────────────────────

export const db = knex(knexConfig);
initVctTable(db);

// ─────────────────────────────────────────────────────────────
// AJV Validation initialization
// ─────────────────────────────────────────────────────────────

const ajv = new Ajv2020({
	allErrors: true,
	strict: true,
	allowUnionTypes: true,
	useDefaults: true,
	coerceTypes: true,
});
addFormats(ajv); // support uri, etc.
export const validateAjv = ajv.compile(typeMetadataSchema);

// ─────────────────────────────────────────────────────────────
// Basic info endpoints
// ─────────────────────────────────────────────────────────────

app.use("/api", apiRouter);

// ─────────────────────────────────────────────────────────────
// VCT registry API (VCT-focused)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/vct
 * Returns a simple list of all VCTs + names.
 */
app.get("/api/vct", async (_req, res) => {
	const result = await getAllVctMetadata(db);

	const list = result.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
});

// ─────────────────────────────────────────────────────────────
// VCT API compatible with demo-issuer style (by vct)
// ─────────────────────────────────────────────────────────────

app.use("/type-metadata", typeMetadataRouter);

// ─────────────────────────────────────────────────────────────
// Static frontend
// ─────────────────────────────────────────────────────────────

const publicPath = path.join(__dirname, "../public");

// 30-day immutable cache for images
app.use(
	"/images",
	express.static(path.join(publicPath, "images"), {
		maxAge: "30d",
		immutable: true,
	}),
);

// No caching for the rest of the UI (HTML, JS, CSS)
app.use(
	express.static(publicPath, {
		maxAge: 0,
	}),
);

app.get("/", (_req, res) => {
	res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/edit", basicAuth, (_req, res) => {
	res.sendFile(path.join(publicPath, "edit.html"));
});

// ─────────────────────────────────────────────────────────────
// DB CRUD operations
// ─────────────────────────────────────────────────────────────

app.use("/vct", basicAuth, dbVctRouter);

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
	console.log(`✅ vct-registry server listening at http://localhost:${PORT}`);
});
