import {
	getMetadataViewUrl,
	initialSdJwtVcMetadata,
	initialAddMdocData,
	initializeEditor,
	onEditorContentChange,
	showErrors,
} from './app.js';
import { addUriIntegrityToEditor } from './uri-integrity.js';

let editor;

const container = document.getElementById('jsoneditor');
const typeSelect = document.getElementById('metadata-type');
typeSelect.disabled = true;

async function initializeEditorAndLoadMetadata() {
	try {
		editor = await initializeEditor(
			container,
			undefined,
			initialSdJwtVcMetadata,
			onEditorContentChange,
			typeSelect.value,
		);
		const drafts = {
			'dc+sd-jwt': JSON.stringify(initialSdJwtVcMetadata, null, 2),
			mso_mdoc: JSON.stringify(initialAddMdocData, null, 2),
		};
		let currentFormat = typeSelect.value;
		typeSelect.addEventListener('change', () => {
			drafts[currentFormat] = editor.getText();
			currentFormat = typeSelect.value;
			editor.setText(drafts[currentFormat]);
			try {
				onEditorContentChange(editor.get());
			} catch {
				// Preserve drafts containing incomplete JSON when switching types.
			}
			void editor.validate();
		});
		typeSelect.disabled = false;
		onEditorContentChange(initialSdJwtVcMetadata);
		await editor.validate();
	} catch (error) {
		typeSelect.disabled = true;
		showErrors('Failed to load metadata editor', error);
	}
}

document.getElementById('registry-submit-btn').addEventListener('click', async () => {
	if (
		!confirm(
			'Are you sure you want to create this type metadata entry? SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.',
		)
	) {
		return;
	}

	let editorData = editor.get();

	try {
		await addUriIntegrityToEditor(editor);
		editorData = editor.get();
	} catch (error) {
		console.error('Error calculating URI integrity:', error);
		showErrors('Failed to create type metadata', {
			message: `Failed to calculate URI integrity. ${error.message}`,
		});
		return;
	}

	const res = await fetch('api/type-metadata/create', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			identifier: typeSelect.value === 'mso_mdoc' ? editorData.doctype : editorData.vct,
			format: typeSelect.value,
			metadata: editorData,
		}),
	});

	const result = await res.json();
	if (!res.ok) {
		showErrors('Failed to create type metadata', result);
	} else {
		const redirectUrl = new URL(
			getMetadataViewUrl(
				typeSelect.value === 'mso_mdoc' ? editorData.doctype : editorData.vct,
			),
			window.location.href,
		);
		redirectUrl.searchParams.set('toast', 'add-success');
		window.location.href = redirectUrl.toString();
	}
});

window.addEventListener('DOMContentLoaded', initializeEditorAndLoadMetadata);
