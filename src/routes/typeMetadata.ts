import { Router } from "express";
import { decodeVct } from "../util";
import { getAllVctMetadata, getVctByUrn } from "../db/vct";
import { typeMetadataSchema } from "../schema/typeMetadataSchema";
import { db } from "../server"; // TODO vmarkop is this ok?

/** /type-metadata */
const typeMetadataRouter = Router();

/**
 * GET /type-metadata?vct=urn:...
 * Returns the metadata object whose .vct matches the query.
 * Also acts as database getter for vct records.
 */
typeMetadataRouter.get("/", async (req, res) => {

	const vct = decodeVct(req.query.vct);

	if (vct == undefined) {
		return res.status(400).json({
			error: 'missing_vct',
			message: 'Query parameter "vct" is required',
		});
	}

	if (vct == null) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Query parameter "vct" must be a valid URI string',
		});
	}

	const metadata = await getVctByUrn(db, vct);

	if (!metadata) {
		return res.status(404).json({
			error: "unknown_vct",
			message: `No metadata found for vct "${vct}"`,
		});
	}

	res.json(metadata);
});

/**
 * GET /type-metadata/all
 * Returns an array of all metadata objects.
 */
typeMetadataRouter.get("/all", async (_req, res) => {
	res.json(await getAllVctMetadata(db));
});

/**
 * GET /type-metadata/schema
 * Returns the JSON schema for type metadata.
 */
typeMetadataRouter.get("/schema", (_req, res) => {
	res.json(typeMetadataSchema);
});

export default typeMetadataRouter;
