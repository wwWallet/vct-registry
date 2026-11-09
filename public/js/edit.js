import {
	decodeIdentifier,
	fetchJson,
	getMetadataViewUrl,
	initializeCopyButtons,
	initializeEditor,
	onEditorContentChange,
	showErrors,
} from './app.js';
import { addUriIntegrityToEditor } from './uri-integrity.js';

let editor;
let identifier;
let format;

const container = document.getElementById('jsoneditor');

async function initializeEditorAndLoadMetadata() {
	try {
		await loadSelectedMetadata();
	} catch (error) {
		showErrors('Failed to load metadata editor', error);
	}
}

function validateMetadata(value) {
	const errors = [];

	if (value && identifier && (format === 'mso_mdoc' ? value.doctype : value.vct) !== identifier) {
		errors.push({
			path: [format === 'mso_mdoc' ? 'doctype' : 'vct'],
			message: 'Cannot change the type metadata identifier.',
		});
	}

	return errors;
}

async function loadSelectedMetadata() {
	const params = new URLSearchParams(window.location.search);
	const value = params.get('identifier') ?? params.get('id') ?? params.get('vct');
	identifier = params.has('identifier') || params.has('id') ? value : decodeIdentifier(value);

	const cancelButton = document.getElementById('registry-cancel-btn');
	if (cancelButton) {
		cancelButton.href = getMetadataViewUrl(identifier);
	}

	const encoded = encodeURIComponent(identifier);
	const fetchMetadataUrl = `api/type-metadata/entry?identifier=${encoded}`;

	const entry = await fetchJson(fetchMetadataUrl);
	format = entry.format;
	const metadata = entry.metadata;
	document.getElementById('edit-metadata-format-value').textContent = format;
	editor = await initializeEditor(
		container,
		validateMetadata,
		metadata,
		onEditorContentChange,
		format,
	);
	await editor.validate();
	onEditorContentChange(metadata);

	const titleContainer = document.getElementById('edit-metadata-title');
	const title =
		metadata.name || `${format === 'mso_mdoc' ? metadata.doctype : metadata.vct} Type Metadata`;
	titleContainer.textContent = `Edit ${title}`;
}

document.getElementById('registry-submit-btn').addEventListener('click', async () => {
	if (
		!confirm(
			'Are you sure you want to edit this type metadata entry? This action is irreversible. SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.',
		)
	) {
		return;
	}

	let editorData = editor.get();
	if ((format === 'mso_mdoc' ? editorData.doctype : editorData.vct) !== identifier) {
		showErrors('Failed to save type metadata', {
			message: 'The type metadata identifier cannot be changed.',
		});
		return;
	}

	try {
		await addUriIntegrityToEditor(editor);
		editorData = editor.get();
	} catch (error) {
		console.error('Error calculating URI integrity:', error);
		showErrors('Failed to save type metadata', {
			message: `Failed to calculate URI integrity. ${error.message}`,
		});
		return;
	}

	const res = await fetch('api/type-metadata/edit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			identifier: identifier,
			format,
			metadata: editorData,
		}),
	});

	const result = await res.json();
	if (!res.ok) {
		showErrors('Failed to save type metadata', result);
	} else {
		const redirectUrl = new URL(getMetadataViewUrl(identifier), window.location.href);
		redirectUrl.searchParams.set('toast', 'edit-success');
		window.location.href = redirectUrl.toString();
	}
});

window.addEventListener('DOMContentLoaded', () => {
	initializeEditorAndLoadMetadata();
	initializeCopyButtons();
});
