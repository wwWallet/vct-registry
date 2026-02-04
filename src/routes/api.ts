import { Router } from "express";

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

export default apiRouter;
