import { Router } from "express";
import type { Request } from "express";
import { authView } from "../middleware/auth";
import { config } from "../../config";
import { getAllVctMetadata } from "../db/vct";
import { db } from "../server";
import { getMetadataPreviewDataUri } from "../util/metadataPreview";

/** / */
const viewsRouter = Router();
const baseHref = config.base_url.endsWith("/") ? config.base_url : `${config.base_url}/`;

function getRegistryBaseUrl(req: Request): string {
	const origin = `${req.protocol}://${req.get("host")}/`;
	return new URL(baseHref, origin).toString();
}

viewsRouter.get("/", async (req, res) => {
	const registryBaseUrl = getRegistryBaseUrl(req);
	try {
		const metadataList = await getAllVctMetadata(db);
		const metadataWithPreview = await Promise.all(
			metadataList.map(async (metadata: any) => ({
				...metadata,
				dataUri: await getMetadataPreviewDataUri(metadata),
			})),
		);
		res.render("pages/home.njk", {
			baseHref,
			registryBaseUrl,
			currentPage: "home",
			metadataList: metadataWithPreview,
			homeError: "",
		});
	} catch (err) {
		res.render("pages/home.njk", {
			baseHref,
			registryBaseUrl,
			currentPage: "home",
			metadataList: [],
			homeError: err instanceof Error ? err.message : "Failed to load metadata cards.",
		});
	}
});

viewsRouter.get("/metadata", (req, res) => {
	res.render("pages/index.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "metadata",
	});
});

viewsRouter.get("/vct-list", async (_req, res) => {
	const result = await getAllVctMetadata(db);
	const list = result.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
});

viewsRouter.get("/usage", (req, res) => {
	res.render("pages/usage.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "usage",
	});
});

viewsRouter.get("/add", authView, (req, res) => {
	res.render("pages/add.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "metadata",
	});
});

viewsRouter.get("/edit", authView, (req, res) => {
	res.render("pages/edit.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "metadata",
	});
});

export default viewsRouter;
