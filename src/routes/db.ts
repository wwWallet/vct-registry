import { Router } from "express";
import { TypeMetadata } from "../schema/SdJwtVcTypeMetadataSchema";
import { db, validateAjv } from "../server";
import { createVct, deleteVctByUrn, getVctByUrn, updateVctByUrn } from "../db/vct";
import { decodeVct } from "../util";

/** /vct */
const dbVctRouter = Router();

/**
 * NO GET /vct/get?vct=urn:... endpoint - this is handled by GET /type-metadata?.
 */

dbVctRouter.post("/create", async (req, res) => {

	const vct = decodeVct(req.body.vct);

	if (vct == undefined) {
		return res.status(400).json({
			error: 'missing_vct',
			message: 'Body parameter "vct" is required',
		});
	}

	if (vct == null) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Body parameter "vct" must be a valid URI string',
		});
	}

	const exists = await getVctByUrn(db, vct);
	if (exists) {
		return res.status(400).json({
			error: 'vct_already_exists',
			message: `A VCT with urn "${vct}" already exists.`,
		});
	}

	const metadata = req.body.metadata;

	if (!metadata || typeof metadata !== "object") {
		return res.status(400).json({
			error: "missing_vct_content",
			message: 'Body parameter "metadata" (object) is required',
		});
	}

	// zod validation
	const zodVctValidationResult = TypeMetadata.safeParse(metadata);
	if (!zodVctValidationResult.success) {
		return res.status(400).json({
			error: "invalid_metadata",
			message:
				"Metadata zod validation failed. Errors: " +
				JSON.stringify(zodVctValidationResult.error),
		});
	}
	const parsedVctContent = zodVctValidationResult.data;

	// ajv validation
	const ajvValidationResult = validateAjv(parsedVctContent);
	if (!ajvValidationResult) {
		return res.status(400).json({
			error: "invalid_metadata",
			message:
				"Metadata AJV validation failed. Errors: " +
				JSON.stringify(validateAjv.errors),
		});
	}

	if (parsedVctContent.vct !== vct) {
		return res.status(400).json({
			error: "vct_urn_mismatch",
			message: `VCT name in content ("${parsedVctContent.vct}") does not match VCT name in query ("${vct}"). It is not possible to change the VCT urn.`,
		});
	}

	const result = await createVct(db, vct, parsedVctContent);

	if (result !== 1) {
		return res.status(500).json({
			error: "creation_failed",
			message: `VCT "${vct}" could not be created.`,
		});
	}
	res.json({ message: "VCT Created successfully", data: result });
});

dbVctRouter.post("/edit", async (req, res) => {

	const vct = decodeVct(req.body.vct);

	if (vct == undefined) {
		return res.status(400).json({
			error: 'missing_vct',
			message: 'Body parameter "vct" is required',
		});
	}

	if (vct == null) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Body parameter "vct" must be a valid URI string',
		});
	}

	const metadata = req.body.metadata;

	if (!metadata || typeof metadata !== "object") {
		return res.status(400).json({
			error: "missing_vct_content",
			message: 'Body parameter "metadata" (object) is required',
		});
	}

	// zod validation
	const zodVctValidationResult = TypeMetadata.safeParse(metadata);
	if (!zodVctValidationResult.success) {
		return res.status(400).json({
			error: "invalid_metadata",
			message:
				"Metadata zod validation failed. Errors: " +
				JSON.stringify(zodVctValidationResult.error),
		});
	}
	const parsedVctContent = zodVctValidationResult.data;

	// ajv validation
	const ajvValidationResult = validateAjv(parsedVctContent);
	if (!ajvValidationResult) {
		return res.status(400).json({
			error: "invalid_metadata",
			message:
				"Metadata AJV validation failed. Errors: " +
				JSON.stringify(validateAjv.errors),
		});
	}

	if (parsedVctContent.vct !== vct) {
		return res.status(400).json({
			error: "vct_urn_mismatch",
			message: `VCT name in content ("${parsedVctContent.vct}") does not match VCT name in query ("${vct}"). It is not possible to change the VCT urn.`,
		});
	}

	const result = await updateVctByUrn(db, vct, parsedVctContent);

	if (result === 0) {
		return res.status(404).json({
			error: "unknown_vct",
			message: `VCT with urn "${vct}" not found. Updating failed.`,
		});
	}

	if (result > 1) {
		return res.status(400).json({
			error: "many_vct_updated",
			message: `More than one VCT with name "${vct}" was found. All have been updated, which is unexpected.`,
		});
	}
	res.json({ message: "VCT Updated successfully", data: result[0] });
});

dbVctRouter.post("/delete", async (req, res) => {
	const vct = decodeVct(req.body.vct);

	if (vct == undefined) {
		return res.status(400).json({
			error: 'missing_vct',
			message: 'Body parameter "vct" is required',
		});
	}

	if (vct == null) {
		return res.status(400).json({
			error: 'invalid_vct',
			message: 'Body parameter "vct" must be a valid URI string',
		});
	}

	const result = await deleteVctByUrn(db, vct);

	if (!result) {
		return res.status(404).json({
			error: "unknown_vct",
			message: `VCT with urn "${vct}" not found. Deleting failed.`,
		});
	}

	if (result > 1) {
		return res.status(400).json({
			error: "many_vct_deleted",
			message: `More than one VCT with name "${vct}" was found. All have been deleted, which is unexpected.`,
		});
	}
	res.json({ message: "VCT Deleted successfully" });
});

export default dbVctRouter;
