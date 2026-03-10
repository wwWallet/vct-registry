import { Router } from "express";
import type { Request, Response } from "express";
import { authView, getSessionUsername } from "../middleware/auth";
import { config } from "../../config";
import { getAllVctMetadata } from "../db/vct";
import { db } from "../server";
import { getMetadataPreviewDataUri } from "../util/metadataPreview";
import type { TypeMetadata } from "../schema/SdJwtVcTypeMetadataSchema";

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

function getBreadcrumbs(current: "metadata" | "usage" | "add" | "edit") {
	switch (current) {
		case "metadata":
			return [
				{ label: "Home", href: "./" },
				{ label: "Metadata" },
			];
		case "usage":
			return [
				{ label: "Home", href: "./" },
				{ label: "Usage" },
			];
		case "add":
			return [
				{ label: "Home", href: "./" },
				{ label: "Metadata", href: "./metadata" },
				{ label: "Add metadata" },
			];
		case "edit":
			return [
				{ label: "Home", href: "./" },
				{ label: "Metadata", href: "./metadata" },
				{ label: "Edit metadata" },
			];
	}
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

function reverseMetadataList<T>(items: T[]): T[] {
	return items.slice().reverse();
}

function getBaseViewLocals(req: Request) {
	return {
		baseHref,
		registryBaseUrl: getRegistryBaseUrl(req),
		...getAuthViewState(req),
	};
}

function renderView(
	req: Request,
	res: Response,
	template: string,
	options: Record<string, unknown>,
) {
	res.render(template, {
		...getBaseViewLocals(req),
		...options,
	});
}

viewsRouter.get("/", async (req, res) => {
	try {
		const metadataList = reverseMetadataList(await getAllVctMetadata(db));
		const metadataWithPreview = await Promise.all(
			metadataList.map(async (metadata: TypeMetadata) => ({
				...metadata,
				dataUri: await getMetadataPreviewDataUri(metadata),
			})),
		);
		renderView(req, res, "pages/home.njk", {
			currentPage: "home",
			metadataList: metadataWithPreview,
			homeError: "",
		});
	} catch (err) {
		renderView(req, res, "pages/home.njk", {
			currentPage: "home",
			metadataList: [],
			homeError: err instanceof Error ? err.message : "Failed to load metadata cards.",
		});
	}
});

viewsRouter.get("/metadata", async (req, res) => {
	try {
		const metadataList = reverseMetadataList(await getAllVctMetadata(db));
		const queryVct = readQueryVct(req);
		const selectedMetadata = queryVct ? metadataList.find((meta) => meta.vct === queryVct) : undefined;
		const selectedMetadataPreview = selectedMetadata
			? await getMetadataPreviewDataUri(selectedMetadata)
			: null;
		const selectedVct = selectedMetadata ? selectedMetadata.vct : "__all__";
		const selectedPayload = selectedVct === "__all__" ? metadataList : selectedMetadata;
		const { registryBaseUrl } = getBaseViewLocals(req);
		const sourceUrl = selectedVct === "__all__"
			? `${registryBaseUrl}type-metadata/all`
			: `${registryBaseUrl}type-metadata?vct=${encodeURIComponent(selectedVct)}`;

		renderView(req, res, "pages/metadata.njk", {
			currentPage: "metadata",
			breadcrumbs: getBreadcrumbs("metadata"),
			metadataList,
			selectedVct,
			selectedMetadata,
			selectedMetadataPreview,
			sourceUrl,
			metadataJson: JSON.stringify(selectedPayload, null, 2),
			metadataError: "",
		});
	} catch (err) {
		const { registryBaseUrl } = getBaseViewLocals(req);
		renderView(req, res, "pages/metadata.njk", {
			currentPage: "metadata",
			breadcrumbs: getBreadcrumbs("metadata"),
			metadataList: [],
			selectedVct: "__all__",
			selectedMetadata: null,
			selectedMetadataPreview: null,
			sourceUrl: `${registryBaseUrl}type-metadata/all`,
			metadataJson: "",
			metadataError: err instanceof Error ? err.message : "Failed to load metadata.",
		});
	}
});

viewsRouter.get("/vct-list", async (_req, res) => {
	const result = reverseMetadataList(await getAllVctMetadata(db));
	const list = result.map((meta) => ({
		vct: meta.vct,
		name: meta.name,
	}));

	res.json(list);
});

viewsRouter.get("/usage", (req, res) => {
	renderView(req, res, "pages/usage.njk", {
		currentPage: "usage",
		breadcrumbs: getBreadcrumbs("usage"),
	});
});

viewsRouter.get("/add", authView, (req, res) => {
	renderView(req, res, "pages/add.njk", {
		currentPage: "metadata",
		breadcrumbs: getBreadcrumbs("add"),
	});
});

viewsRouter.get("/edit", authView, (req, res) => {
	renderView(req, res, "pages/edit.njk", {
		currentPage: "metadata",
		breadcrumbs: getBreadcrumbs("edit"),
	});
});

export default viewsRouter;
