import {
	decodeVct,
	fetchJson,
	getMetadataViewUrl,
	initializeCopyButtons,
	initializeEditor,
	onEditorContentChange,
	showErrors
} from "./app.js";
import { addUriIntegrityToEditor, getUriIntegrityPaths } from "./uri-integrity.js";

let editor;
let vctUrn;

const container = document.getElementById("jsoneditor");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, validateVct, undefined, onEditorContentChange);
	await loadSelectedVct();
}

function validateVct(value) {

	const errors = [];

	if (value && vctUrn && value.vct != decodeVct(vctUrn)) {
		errors.push({
        path: ["vct"],
        message: "Cannot edit the urn of a VCT."
      });
	}

	for (const integrityPath of getUriIntegrityPaths(value)) {
		errors.push({
			path: integrityPath,
			message: "URI Integrity values are calculated on submission. This value will be overwritten."
      });
	}

	return errors;
}

async function loadSelectedVct() {
	const params = new URLSearchParams(window.location.search);
	const value = params.get("vct"); // ?vct=urn:eudi:pid:1
	vctUrn = value;

	const cancelButton = document.getElementById("vct-cancel-btn");
	if (cancelButton) {
		cancelButton.href = getMetadataViewUrl(value);
	}

	const encoded = encodeURIComponent(value);
	const fetchMetadataUrl = `type-metadata?vct=${encoded}`;

	const metadata = await fetchJson(fetchMetadataUrl);
	editor.set(metadata);
	onEditorContentChange(metadata);

	const vctIdContainer = document.getElementById("edit-vct-title");
	vctIdContainer.textContent = `Edit VCT ${metadata.vct}`;
}

document
	.getElementById("vct-submit-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to edit this VC Type Metadata entry? This action is irreversible. SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.")) {
			return;
		}

		const editorData = editor.get();

		if (editorData.vct !== decodeVct(vctUrn)) {
			showErrors("Failed to save VC Type Metadata", { message: "The 'vct' URN value in the VC Type metadata cannot be changed." });
			return;
		}

		try {
			await addUriIntegrityToEditor(editor);
		} catch (error) {
			console.error("Error calculating URI integrity:", error);
			showErrors("Failed to save VC Type Metadata", { message: `Failed to calculate URI integrity. ${error.message}` });
			return;
		}

		const res = await fetch("vct/edit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				vct: vctUrn,
				metadata: editorData,
			}),
		});

		const result = await res.json();
		if (!res.ok) {
			showErrors("Failed to save VC Type Metadata", result);
		} else {
			const redirectUrl = new URL(getMetadataViewUrl(vctUrn), window.location.href);
			redirectUrl.searchParams.set("toast", "edit-success");
			window.location.href = redirectUrl.toString();
		}
	});

window.addEventListener("DOMContentLoaded", () => {
	initializeEditorAndLoadVct();
	initializeCopyButtons();
});
