import { Router } from 'express';
import { decodeVct } from '../util';
import { TypeMetadata } from '../schema/SdJwtVcTypeMetadataSchema';
import { db, validateAjv } from '../server';
import { createVct, deleteVctByName, updateVctByName } from '../db/vct';

/** /vct */
const dbVctRouter = Router();

/**
 * NO GET /vct/get?vct=urn:... endpoint - this is handled by GET /type-metadata?.
 */

dbVctRouter.post('/create', async (req, res) => {

    const {vct, metadata} = req.body;

    if (!vct || typeof vct !== 'string') {
        return res.status(400).json({
            error: 'missing_vct',
            message: 'Body parameter "vct" is required',
        });
    }

    if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({
            error: 'missing_vct_content',
            message: 'Body parameter "metadata" (object) is required',
        });
    }

    const decodedVct = decodeVct(vct);

    // zod validation
    const zodVctValidationResult = TypeMetadata.safeParse(metadata);
    if (!zodVctValidationResult.success) {
        return res.status(400).json({
            error: 'invalid_metadata',
            message: 'Metadata zod validation failed. Errors: ' + JSON.stringify(zodVctValidationResult.error),
        });
    }
    const parsedVctContent = zodVctValidationResult.data;

    // ajv validation
    const ajvValidationResult = validateAjv(parsedVctContent);
    if (!ajvValidationResult) {
        return res.status(400).json({
            error: 'invalid_metadata',
            message: 'Metadata AJV validation failed. Errors: ' + JSON.stringify(validateAjv.errors),
        });
    }

    if (parsedVctContent.vct !== decodedVct) {
        return res.status(400).json({
            error: 'vct_urn_mismatch',
            message: `VCT name in content ("${parsedVctContent.vct}") does not match VCT name in query ("${decodedVct}"). It is not possible to change the VCT urn.`,
        });
    }

    const result = await createVct(db, decodedVct, parsedVctContent);

    if (!result) {
        return res.status(500).json({
            error: 'creation_failed',
            message: `VCT with name "${decodedVct}" could not be created.`,
        });
    }
    res.json({ message: 'VCT Created successfully', data: result });
});

dbVctRouter.post('/edit', async (req, res) => {
    const {vct, metadata} = req.body;

    if (!vct || typeof vct !== 'string') {
        return res.status(400).json({
            error: 'missing_vct',
            message: 'Body parameter "vct" is required',
        });
    }

    if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({
            error: 'missing_vct_content',
            message: 'Body parameter "vctContent" (object) is required',
        });
    }

    const decodedVct = decodeVct(vct);

    // zod validation
    const zodVctValidationResult = TypeMetadata.safeParse(metadata);
    if (!zodVctValidationResult.success) {
        return res.status(400).json({
            error: 'invalid_metadata',
            message: 'Metadata zod validation failed. Errors: ' + JSON.stringify(zodVctValidationResult.error),
        });
    }
    const parsedVctContent = zodVctValidationResult.data;

    // ajv validation
    const ajvValidationResult = validateAjv(parsedVctContent);
    if (!ajvValidationResult) {
        return res.status(400).json({
            error: 'invalid_metadata',
            message: 'Metadata AJV validation failed. Errors: ' + JSON.stringify(validateAjv.errors),
        });
    }

    if (parsedVctContent.vct !== decodedVct) {
        return res.status(400).json({
            error: 'vct_urn_mismatch',
            message: `VCT name in content ("${parsedVctContent.vct}") does not match VCT name in query ("${decodedVct}"). It is not possible to change the VCT urn.`,
        });
    }

    const result = await updateVctByName(db, decodedVct, parsedVctContent);

    if (result === 0) {
        return res.status(404).json({
            error: 'unknown_vct',
            message: `VCT with name "${decodedVct}" not found. Updating failed.`,
        });
    }

    if (result > 1) {
        return res.status(400).json({
            error: 'many_vct_updated',
            message: `More than one VCT with name "${decodedVct}" was found. All have been updated, which is unexpected.`,
        });
    }
    res.json({ message: 'VCT Updated successfully', data: result[0] });
});

dbVctRouter.post('/delete', async (req, res) => {
    const rawVct = req.query.vct;

    if (!rawVct || typeof rawVct !== 'string') {
        return res.status(400).json({
            error: 'missing_vct',
            message: 'Query parameter "vct" is required',
        });
    }

    const decodedVct = decodeVct(rawVct);
    const result = await deleteVctByName(db, decodedVct);

        if (!result) {
        return res.status(404).json({
            error: 'unknown_vct',
            message: `VCT with name "${decodedVct}" not found. Deleting failed.`,
        });
    }

    if (result > 1) {
        return res.status(400).json({
            error: 'many_vct_deleted',
            message: `More than one VCT with name "${decodedVct}" was found. All have been deleted, which is unexpected.`,
        });
    }
    res.json({ message: 'VCT Deleted successfully' });
});

export default dbVctRouter;
