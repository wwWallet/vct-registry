import { Router } from 'express';
import type { Request, Response } from 'express';
import { authView, getSessionUsername } from '../middleware/auth';
import { config } from '../../config';
import { getAllTypeMetadata, getTypeMetadataEntry } from '../db/typeMetadata';
import { db } from '../server';
import { getMetadataPreviewDataUri, getMetadataPreviewSvgUris } from '../util/metadataPreview';
import { getMetadataId } from '../schemas/metadata';
import type { RegistryMetadata } from '../schemas/metadata';
import { reverseList } from '../util';

/** / */
const viewsRouter = Router();

function getAuthViewState(req: Request) {
	const username = getSessionUsername(req);
	return {
		isAuthenticated: Boolean(username),
		username: username ?? '',
	};
}

function getBreadcrumbs(current: 'metadata' | 'usage' | 'add' | 'edit') {
	switch (current) {
		case 'metadata':
			return [{ label: 'Home', href: './' }, { label: 'Metadata' }];
		case 'usage':
			return [{ label: 'Home', href: './' }, { label: 'Usage' }];
		case 'add':
			return [
				{ label: 'Home', href: './' },
				{ label: 'Metadata', href: './metadata' },
				{ label: 'Add metadata' },
			];
		case 'edit':
			return [
				{ label: 'Home', href: './' },
				{ label: 'Metadata', href: './metadata' },
				{ label: 'Edit metadata' },
			];
	}
}

function readQueryIdentifier(req: Request): string | undefined {
	const identifierParam = req.query.identifier ?? req.query.id;
	if (identifierParam !== undefined)
		return typeof identifierParam === 'string' ? identifierParam : undefined;
	const legacyValue = req.query.vct;
	if (typeof legacyValue !== 'string') return undefined;
	try {
		return decodeURIComponent(legacyValue);
	} catch {
		return legacyValue;
	}
}

function getBaseViewLocals(req: Request) {
	return {
		registryBaseUrl: config.url,
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

viewsRouter.get('/', async (req, res) => {
	try {
		const metadataList = reverseList(await getAllTypeMetadata(db));
		const metadataWithPreview = await Promise.all(
			metadataList.map(async (metadata: RegistryMetadata) => ({
				...metadata,
				identifier: getMetadataId(metadata),
				dataUri: await getMetadataPreviewDataUri(metadata, {
					preferredProperties: {
						orientation: 'landscape',
					},
				}),
			})),
		);
		renderView(req, res, 'pages/home.njk', {
			currentPage: 'home',
			metadataList: metadataWithPreview,
			homeError: '',
		});
	} catch (err) {
		renderView(req, res, 'pages/home.njk', {
			currentPage: 'home',
			metadataList: [],
			homeError: err instanceof Error ? err.message : 'Failed to load metadata cards.',
		});
	}
});

viewsRouter.get('/metadata', async (req, res) => {
	try {
		const originalMetadataList = reverseList(await getAllTypeMetadata(db));
		const metadataList = originalMetadataList.map((metadata) => ({
			...metadata,
			identifier: getMetadataId(metadata),
		}));
		const queryIdentifier = readQueryIdentifier(req);
		const selectedMetadata = queryIdentifier
			? metadataList.find((meta) => meta.identifier === queryIdentifier)
			: undefined;
		const selectedMetadataPreviewSvgUris = selectedMetadata
			? getMetadataPreviewSvgUris(selectedMetadata)
			: [];
		const selectedIdentifier = selectedMetadata ? selectedMetadata.identifier : '__all__';
		const selectedFormat = selectedMetadata
			? (await getTypeMetadataEntry(db, selectedIdentifier))?.format
			: undefined;
		const selectedPayload =
			selectedIdentifier === '__all__'
				? originalMetadataList
				: originalMetadataList.find(
						(metadata) => getMetadataId(metadata) === selectedIdentifier,
					);
		const { registryBaseUrl } = getBaseViewLocals(req);
		const sourceUrl =
			selectedIdentifier === '__all__'
				? `${registryBaseUrl}/type-metadata/all`
				: `${registryBaseUrl}/type-metadata?identifier=${encodeURIComponent(selectedIdentifier)}`;

		renderView(req, res, 'pages/metadata.njk', {
			currentPage: 'metadata',
			breadcrumbs: getBreadcrumbs('metadata'),
			metadataList,
			selectedIdentifier,
			selectedMetadata,
			selectedFormat,
			selectedMetadataPreviewSvgUris,
			sourceUrl,
			metadataJson: JSON.stringify(selectedPayload, null, 2),
			metadataError: '',
		});
	} catch (err) {
		const { registryBaseUrl } = getBaseViewLocals(req);
		renderView(req, res, 'pages/metadata.njk', {
			currentPage: 'metadata',
			breadcrumbs: getBreadcrumbs('metadata'),
			metadataList: [],
			selectedIdentifier: '__all__',
			selectedMetadata: null,
			selectedMetadataPreviewSvgUris: [],
			sourceUrl: `${registryBaseUrl}/type-metadata/all`,
			metadataJson: '',
			metadataError: err instanceof Error ? err.message : 'Failed to load metadata.',
		});
	}
});

viewsRouter.get('/usage', (req, res) => {
	renderView(req, res, 'pages/usage.njk', {
		currentPage: 'usage',
		breadcrumbs: getBreadcrumbs('usage'),
	});
});

viewsRouter.get('/add', authView, (req, res) => {
	renderView(req, res, 'pages/add.njk', {
		currentPage: 'metadata',
		breadcrumbs: getBreadcrumbs('add'),
	});
});

viewsRouter.get('/edit', authView, (req, res) => {
	renderView(req, res, 'pages/edit.njk', {
		currentPage: 'metadata',
		breadcrumbs: getBreadcrumbs('edit'),
	});
});

export default viewsRouter;
