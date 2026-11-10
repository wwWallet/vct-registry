import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { MetadataPage } from '../src/pages/MetadataPage';
import { MetadataEditorPage } from '../src/pages/MetadataEditorPage';
import {
	createMetadata,
	updateMetadata,
	deleteMetadata,
	getMetadataEntry,
	getMetadataPreview,
	getMetadataSchema,
} from '../src/api/client';
import { metadataId, metadataFormat } from '../src/types';
import type { TypeMetadata } from '../src/types';

vi.mock('../src/auth', () => ({
	useAuth: () => ({ auth: { loggedIn: true }, handleAuthError: vi.fn() }),
}));
vi.mock('../src/components/JsonMetadataEditor', () => ({
	JsonMetadataEditor: () => null,
}));

const entries: TypeMetadata[] = [
	{ vct: 'urn:example:pid', name: 'PID' },
	{ doctype: 'org.example.a%2Fb&c', name: 'Document' },
];
const fetchMock = vi.fn();
beforeEach(() => {
	vi.stubGlobal('window', { location: { origin: 'https://registry.example' } });
	vi.stubGlobal('fetch', fetchMock);
	fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('React metadata integration', () => {
	it.each(entries)('uses the authenticated management API for $name', async (metadata) => {
		const identifier = metadataId(metadata);
		const format = metadataFormat(metadata);
		await createMetadata(metadata);
		expect(fetchMock).toHaveBeenLastCalledWith(
			'/api/type-metadata/create',
			expect.objectContaining({
				credentials: 'include',
				method: 'POST',
				body: JSON.stringify({ identifier, format, metadata }),
			}),
		);
		await updateMetadata(identifier, metadata);
		expect(fetchMock).toHaveBeenLastCalledWith(
			'/api/type-metadata/edit',
			expect.objectContaining({
				body: JSON.stringify({ identifier, metadata }),
			}),
		);
		await deleteMetadata(identifier);
		expect(fetchMock).toHaveBeenLastCalledWith(
			'/api/type-metadata/delete',
			expect.objectContaining({
				body: JSON.stringify({ identifier }),
			}),
		);
	});

	it.each(entries)('loads $name with its stored format, schema and preview', async (metadata) => {
		const identifier = metadataId(metadata);
		const encoded = encodeURIComponent(identifier);
		await getMetadataEntry(identifier);
		expect(fetchMock).toHaveBeenLastCalledWith(
			`/api/type-metadata/entry?identifier=${encoded}`,
			expect.objectContaining({ credentials: 'include' }),
		);
		await getMetadataPreview(identifier);
		expect(fetchMock).toHaveBeenLastCalledWith(
			`/api/type-metadata-preview?identifier=${encoded}`,
			expect.anything(),
		);
		await getMetadataSchema(metadataFormat(metadata));
		expect(fetchMock).toHaveBeenLastCalledWith(
			`/type-metadata/schema/${encodeURIComponent(metadataFormat(metadata))}`,
			expect.anything(),
		);
	});

	it.each(['identifier', 'id', 'vct', 'doctype'])(
		'opens mdoc details through the %s selector',
		(selector) => {
			const entry = entries[1];
			const markup = renderToStaticMarkup(
				createElement(
					MemoryRouter,
					{
						initialEntries: [
							`/metadata?${selector}=${encodeURIComponent(metadataId(entry))}`,
						],
					},
					createElement(MetadataPage, {
						metadata: entries,
						loading: false,
						error: '',
						onMetadataChanged: async () => {},
					}),
				),
			);
			expect(markup).toContain('mso_mdoc');
			expect(markup).toContain('org.example.a%2Fb&amp;c');
			expect(markup).toContain('/edit?identifier=org.example.a%252Fb%26c');
			expect(markup).toContain('/type-metadata?identifier=org.example.a%252Fb%26c');
		},
	);

	it('offers both formats on the create page', () => {
		const markup = renderToStaticMarkup(
			createElement(
				MemoryRouter,
				{},
				createElement(MetadataEditorPage, {
					mode: 'add',
					onSaved: async () => {},
				}),
			),
		);
		expect(markup).toContain('aria-label="Metadata format"');
		expect(markup).toContain('value="dc+sd-jwt"');
		expect(markup).toContain('value="mso_mdoc"');
	});
});
