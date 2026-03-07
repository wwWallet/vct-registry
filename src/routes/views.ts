import { Router } from "express";
import { authView } from "../middleware/auth";
import { config } from "../../config";

/** / */
const viewsRouter = Router();
const baseHref = config.base_url.endsWith("/") ? config.base_url : `${config.base_url}/`;

viewsRouter.get("/", (_req, res) => {
	res.render("pages/index.njk", {
		baseHref,
	});
});

viewsRouter.get("/add", authView, (_req, res) => {
	res.render("pages/add.njk", {
		baseHref,
	});
});

viewsRouter.get("/edit", authView, (_req, res) => {
	res.render("pages/edit.njk", {
		baseHref,
	});
});

export default viewsRouter;
