// src/server.ts
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { config } from "../config";
import knexConfig from "../knexfile";
import { auth, login, logout } from "./middleware/auth";
import { typeMetadataSchema } from "./schema/typeMetadataSchema";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { knex } from "knex";
import { getAllVctMetadata, initVctTable } from "./db/vct";
import apiRouter from "./routes/api";
import typeMetadataRouter from "./routes/typeMetadata";
import dbVctRouter from "./routes/db";
import nunjucks from "nunjucks";

export const app = express();
const PORT = config.port;

// ─────────────────────────────────────────────────────────────
// Middleware initialization
// ─────────────────────────────────────────────────────────────

app.use(cors());
app.use(cookieParser())
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
// Authentication login/logout endpoints
// ─────────────────────────────────────────────────────────────

// Login endpoint: just triggers auth middleware to set cookie
app.get('/login', login, (req, res) => {
	res.send(`Logged in as ${(req as any).username}.`);
});

// Auth endpoint: checks if cookie exists
app.get('/auth', auth, (req, res) => {
	res.send({
		username: (req as any).username
	});
});

// Logout endpoint: clears cookie
app.get('/logout', (req, res) => {
	logout(req, res);
	res.send('Logged out successfully.');
});

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
const viewsPath = path.join(publicPath, "views");

nunjucks.configure(path.join(publicPath, "views"), {
    autoescape: true,
    express: app
});

app.set("view engine", "njk");

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
	res.render(path.join(viewsPath, "index.html"), {
		baseHref: config.base_url,
	});
});

app.get("/edit", auth, (_req, res) => {
	res.render(path.join(viewsPath, "edit.html"), {
		baseHref: config.base_url,
	});
});

// ─────────────────────────────────────────────────────────────
// DB CRUD operations
// ─────────────────────────────────────────────────────────────

app.use("/vct", auth, dbVctRouter);

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
	console.log(`✅ vct-registry server listening at http://localhost:${PORT}`);
});
