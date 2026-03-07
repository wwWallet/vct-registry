import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { config } from "../config";
import knexConfig from "../knexfile";
import { auth } from "./middleware/auth";
import { knex } from "knex";
import { initVctTable } from "./db/vct";
import apiRouter from "./routes/api";
import typeMetadataRouter from "./routes/typeMetadata";
import dbVctRouter from "./routes/db";
import nunjucks from "nunjucks";
import authRouter from "./routes/auth";
import viewsRouter from "./routes/views";

const { url, port } = config;

export const app = express();

app.use(cors());
app.use(cookieParser())
app.use(express.json({
	limit: config.max_vct_size
}));

export const db = knex(knexConfig);
initVctTable(db);

const publicPath = path.join(__dirname, "../public");
export const viewsPath = path.join(__dirname, "views");

nunjucks.configure(viewsPath, {
    autoescape: true,
    express: app
});
app.set("view engine", "njk");

// 1-day immutable cache for images
app.use(
	"/images",
	express.static(path.join(publicPath, "images"), {
		maxAge: "1d",
		immutable: true,
	}),
);

// No caching for the rest of the UI (HTML, JS, CSS)
app.use(
	express.static(publicPath, {
		maxAge: 0,
	}),
);

app.use("/", viewsRouter);
app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/type-metadata", typeMetadataRouter);
app.use("/vct", auth, dbVctRouter);

app.listen(port, () => {
	console.log(`✅ vct-registry server listening at ${url}`);
});
