import { Router } from "express";
import { authView } from "../middleware/auth";
import { config } from "../../config";
import { getAllVctMetadata } from "../db/vct";
import { db } from "../server";

/** / */
const viewsRouter = Router();
const baseHref = config.base_url.endsWith("/") ? config.base_url : `${config.base_url}/`;

viewsRouter.get("/", async (_req, res) => {
	try {
		const metadataList = await getAllVctMetadata(db);
		res.render("pages/home.njk", {
			baseHref,
			currentPage: "home",
			metadataList,
			homeError: "",
		});
	} catch (err) {
		res.render("pages/home.njk", {
			baseHref,
			currentPage: "home",
			metadataList: [],
			homeError: err instanceof Error ? err.message : "Failed to load metadata cards.",
		});
	}
});

viewsRouter.get("/metadata", (_req, res) => {
	res.render("pages/index.njk", {
		baseHref,
		currentPage: "metadata",
	});
});

viewsRouter.get("/add", authView, (_req, res) => {
	res.render("pages/add.njk", {
		baseHref,
		currentPage: "metadata",
	});
});

viewsRouter.get("/edit", authView, (_req, res) => {
	res.render("pages/edit.njk", {
		baseHref,
		currentPage: "metadata",
	});
});

export default viewsRouter;
