import { Router } from "express";
import type { Request, Response } from "express";
import { getAllVctMetadata } from "../db/vct";
import { db } from "../server";

/** /api */
const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
	res.json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

apiRouter.get("/info", (_req, res) => {
	res.json({
		name: "vct-registry",
		version: "1.0.0",
		description: "Express + TypeScript app for local VCT registry metadata.",
	});
});

apiRouter.get("/time", (_req, res) => {
	res.json({
		now: new Date().toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
});

/**
 * Returns a simple list of all VCTs + names.
 */
async function getVctList(_req: Request, res: Response) {
	const result = await getAllVctMetadata(db);

	const list = result.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
}

apiRouter.get("/vct-list", getVctList);

// Backward-compatible alias
apiRouter.get("/vct", getVctList);

export default apiRouter;
