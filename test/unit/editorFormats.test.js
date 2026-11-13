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
		'type-metadata/schema/mso_mdoc': { required: ['doctype'] },
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
		['dc+sd-jwt', 'mso_mdoc'].flatMap((format) =>
			[undefined, '', 'Example Credential'].map((name) => ({ format, name })),
		),
	)(
		'loads $format with name $name into the edit heading and format pill',
		async ({ format, name }) => {
			vi.resetModules();
			const { schemas } = setup();
			const identifier = 'org.example.document';
			const metadata = {
				...(format === 'mso_mdoc' ? { doctype: identifier } : { vct: identifier }),
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

	it('uses the explicit SD JWT VC format and switches schemas when the selected type changes', async () => {
		const { select, schemas, change } = setup();
		const editor = await initializeEditor(
			{},
			undefined,
			{ vct: 'urn:example:test' },
			undefined,
			'dc+sd-jwt',
		);
		expect(editor.options.schema).toEqual(schemas['type-metadata/schema/dc+sd-jwt']);
		select.value = 'mso_mdoc';
		change();
		expect(editor.setSchema).toHaveBeenLastCalledWith(schemas['type-metadata/schema/mso_mdoc']);
		expect(editor.validate).toHaveBeenCalled();
		select.value = 'dc+sd-jwt';
		change();
		expect(editor.setSchema).toHaveBeenLastCalledWith(
			schemas['type-metadata/schema/dc+sd-jwt'],
		);
	});

	it('initializes an existing mdoc entry with its schema and ignores a disabled selector', async () => {
		const { select, schemas, change } = setup(true);
		const editor = await initializeEditor({}, undefined, undefined, undefined, 'mso_mdoc');
		expect(editor.options.schema).toEqual(schemas['type-metadata/schema/mso_mdoc']);
		select.value = 'dc+sd-jwt';
		change();
		expect(editor.setSchema).not.toHaveBeenCalled();
	});

	it('disables submission on validation errors and enables it when valid', async () => {
		const { submit } = setup();
		const editor = await initializeEditor({}, undefined, undefined, undefined, 'dc+sd-jwt');
		editor.options.onValidationError([{ message: 'Missing doctype' }]);
		expect(submit.disabled).toBe(true);
		editor.options.onValidationError([]);
		expect(submit.disabled).toBe(false);
	});

	it('preserves separate drafts, including incomplete JSON, when switching types on add', async () => {
		const { select, schemas, change } = setup();
		let initialize;
		const editors = [];
		vi.stubGlobal('window', {
			addEventListener: (_event, handler) => {
				initialize = handler;
			},
		});
		vi.stubGlobal('document', {
			getElementById: (id) => {
				if (id === 'metadata-type') return select;
				if (id === 'registry-submit-btn') return { addEventListener: vi.fn() };
				return null;
			},
			querySelector: () => null,
		});
		vi.stubGlobal(
			'JSONEditor',
			class {
				constructor(_container, options) {
					this.options = options;
					editors.push(this);
				}
				set(value) {
					this.text = JSON.stringify(value);
				}
				get() {
					return JSON.parse(this.text);
				}
				getText() {
					return this.text;
				}
				setText(value) {
					this.text = value;
				}
				setSchema = vi.fn();
				validate = vi.fn().mockResolvedValue([]);
			},
		);
		await import('../../public/js/add.js');
		await initialize();
		const editor = editors[0];
		expect(select.disabled).toBe(false);
		editor.setText('{ "vct":');
		select.value = 'mso_mdoc';
		change();
		expect(editor.get()).toHaveProperty('doctype');
		expect(editor.setSchema).toHaveBeenLastCalledWith(schemas['type-metadata/schema/mso_mdoc']);
		editor.setText('{"doctype":"org.example.document"}');
		select.value = 'dc+sd-jwt';
		change();
		expect(editor.getText()).toBe('{ "vct":');
		select.value = 'mso_mdoc';
		change();
		expect(editor.get()).toEqual({ doctype: 'org.example.document' });
	});
});
