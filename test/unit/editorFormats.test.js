import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeEditor, getMetadataViewUrl } from '../../public/js/app.js';

afterEach(() => vi.unstubAllGlobals());

function setup(disabled = false) {
	const handlers = [];
	const select = {
		value: 'dc+sd-jwt',
		disabled,
		addEventListener: (_event, handler) => handlers.push(handler),
	};
	const submit = { disabled: true };
	const schemas = {
		'type-metadata/schema/dc+sd-jwt': { required: ['vct'] },
	};
	vi.stubGlobal('document', {
		getElementById: () => select,
		querySelector: () => submit,
	});
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url) => ({ ok: true, json: async () => schemas[url] })),
	);
	vi.stubGlobal(
		'JSONEditor',
		class {
			constructor(_container, options) {
				this.options = options;
			}
			set = vi.fn();
			setSchema = vi.fn();
			validate = vi.fn().mockResolvedValue([]);
		},
	);
	return { select, submit, schemas, change: () => handlers.forEach((handler) => handler()) };
}

describe('Editor metadata type', () => {
	it('generates identifier URLs with one layer of URL encoding', () => {
		expect(getMetadataViewUrl('urn:example:a&b')).toBe(
			'./metadata?identifier=urn%3Aexample%3Aa%26b',
		);
	});
	it.each(
		['dc+sd-jwt'].flatMap((format) =>
			[undefined, '', 'Example Credential'].map((name) => ({ format, name })),
		),
	)(
		'loads $format with name $name into the edit heading and format pill',
		async ({ format, name }) => {
			vi.resetModules();
			const { schemas } = setup();
			const identifier = 'org.example.document';
			const metadata = {
				vct: identifier,
				name,
			};
			const pill = { textContent: '' };
			const title = { textContent: '' };
			let onLoad;
			const editors = [];
			vi.stubGlobal('window', {
				location: { search: `?identifier=${identifier}` },
				addEventListener: (_event, handler) => {
					onLoad = handler;
				},
			});
			vi.stubGlobal('document', {
				getElementById: (id) =>
					({
						'edit-metadata-format-value': pill,
						'edit-metadata-title': title,
						'registry-submit-btn': { addEventListener: vi.fn() },
					})[id] ?? null,
				querySelector: () => null,
				querySelectorAll: () => [],
			});
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url) => ({
					ok: true,
					json: async () =>
						url.startsWith('api/type-metadata/entry')
							? { format, metadata }
							: schemas[url],
				})),
			);
			vi.stubGlobal(
				'JSONEditor',
				class {
					constructor(_container, options) {
						this.options = options;
						editors.push(this);
					}
					set = vi.fn();
					validate = vi.fn().mockResolvedValue([]);
				},
			);
			await import('../../public/js/edit.js');
			onLoad();
			await vi.waitFor(() =>
				expect(title.textContent).toBe(`Edit ${name || `${identifier} Type Metadata`}`),
			);
			expect(pill.textContent).toBe(format);
			expect(editors[0].options.schema).toEqual(schemas[`type-metadata/schema/${format}`]);
		},
	);

	it('disables submission on validation errors and enables it when valid', async () => {
		const { submit } = setup();
		const editor = await initializeEditor({}, undefined, undefined, undefined, 'dc+sd-jwt');
		editor.options.onValidationError([{ message: 'Missing vct' }]);
		expect(submit.disabled).toBe(true);
		editor.options.onValidationError([]);
		expect(submit.disabled).toBe(false);
	});
});
