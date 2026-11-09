import {
	getMetadataViewUrl,
	initialSdJwtVcMetadata,
	initializeEditor,
	onEditorContentChange,
	showErrors,
} from './app.js';
import { addUriIntegrityToEditor } from './uri-integrity.js';

let editor;

const container = document.getElementById('jsoneditor');

async function initializeEditorAndLoadMetadata() {
	try {
		editor = await initializeEditor(
			container,
			undefined,
			initialSdJwtVcMetadata,
			onEditorContentChange,
			'dc+sd-jwt',
		);
		onEditorContentChange(initialSdJwtVcMetadata);
		await editor.validate();
	} catch (error) {
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
			identifier: editorData.vct,
			format: 'dc+sd-jwt',
			metadata: editorData,
		}),
	});

	const result = await res.json();
	if (!res.ok) {
		showErrors('Failed to create type metadata', result);
	} else {
		const redirectUrl = new URL(getMetadataViewUrl(editorData.vct), window.location.href);
		redirectUrl.searchParams.set('toast', 'add-success');
		window.location.href = redirectUrl.toString();
	}
});

window.addEventListener('DOMContentLoaded', initializeEditorAndLoadMetadata);
