import { Router } from "express";
import { authView } from "../middleware/auth";
import { config } from "../../config";
import path from "path";
import { viewsPath } from "../server";

/** / */
const viewsRouter = Router();

viewsRouter.get("/", (_req, res) => {
	res.render(path.join(viewsPath, "index.html"), {
		baseHref: config.base_url,
	});
});

viewsRouter.get("/add", authView, (_req, res) => {
	res.render(path.join(viewsPath, "add.html"), {
		baseHref: config.base_url,
	});
});

viewsRouter.get("/edit", authView, (_req, res) => {
	res.render(path.join(viewsPath, "edit.html"), {
		baseHref: config.base_url,
	});
});

export default viewsRouter;
