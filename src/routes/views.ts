import { Router } from "express";
import type { Request } from "express";
import { authView, getSessionUsername } from "../middleware/auth";
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

function getAuthViewState(req: Request) {
	const username = getSessionUsername(req);
	return {
		isAuthenticated: Boolean(username),
		username: username ?? "",
	};
}

function readQueryVct(req: Request): string | undefined {
	const vctParam = req.query.vct;
	if (typeof vctParam !== "string") return undefined;

	try {
		return decodeURIComponent(vctParam);
	} catch {
		return vctParam;
	}
}

viewsRouter.get("/", async (req, res) => {
	const registryBaseUrl = getRegistryBaseUrl(req);
	const authState = getAuthViewState(req);
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
			...authState,
			metadataList: metadataWithPreview,
			homeError: "",
		});
	} catch (err) {
		res.render("pages/home.njk", {
			baseHref,
			registryBaseUrl,
			currentPage: "home",
			...authState,
			metadataList: [],
			homeError: err instanceof Error ? err.message : "Failed to load metadata cards.",
		});
	}
});

viewsRouter.get("/metadata", async (req, res) => {
	const registryBaseUrl = getRegistryBaseUrl(req);
	const authState = getAuthViewState(req);

	try {
		const metadataList = await getAllVctMetadata(db);
		const queryVct = readQueryVct(req);
		const selectedMetadata = queryVct ? metadataList.find((meta) => meta.vct === queryVct) : undefined;
		const selectedVct = selectedMetadata ? selectedMetadata.vct : "__all__";
		const selectedPayload = selectedVct === "__all__" ? metadataList : selectedMetadata;
		const sourceUrl = selectedVct === "__all__"
			? `${registryBaseUrl}type-metadata/all`
			: `${registryBaseUrl}type-metadata?vct=${encodeURIComponent(selectedVct)}`;

		res.render("pages/metadata.njk", {
			baseHref,
			registryBaseUrl,
			currentPage: "metadata",
			...authState,
			metadataList,
			selectedVct,
			selectedMetadata,
			sourceUrl,
			metadataJson: JSON.stringify(selectedPayload, null, 2),
			metadataError: "",
		});
	} catch (err) {
		res.render("pages/metadata.njk", {
			baseHref,
			registryBaseUrl,
			currentPage: "metadata",
			...authState,
			metadataList: [],
			selectedVct: "__all__",
			selectedMetadata: null,
			sourceUrl: `${registryBaseUrl}type-metadata/all`,
			metadataJson: "",
			metadataError: err instanceof Error ? err.message : "Failed to load metadata.",
		});
	}
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
		...getAuthViewState(req),
	});
});

viewsRouter.get("/add", authView, (req, res) => {
	res.render("pages/add.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "metadata",
		...getAuthViewState(req),
	});
});

viewsRouter.get("/edit", authView, (req, res) => {
	res.render("pages/edit.njk", {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		currentPage: "metadata",
		...getAuthViewState(req),
	});
});

export default viewsRouter;
