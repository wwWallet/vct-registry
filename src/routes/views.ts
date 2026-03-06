import { Router } from "express";
import { authView } from "../middleware/auth";
import { config } from "../../config";

/** / */
const viewsRouter = Router();

viewsRouter.get("/", (_req, res) => {
	res.render("index.njk", {
		baseHref: config.base_url,
	});
});

viewsRouter.get("/add", authView, (_req, res) => {
	res.render("add.njk", {
		baseHref: config.base_url,
	});
});

viewsRouter.get("/edit", authView, (_req, res) => {
	res.render("edit.njk", {
		baseHref: config.base_url,
	});
});

export default viewsRouter;
