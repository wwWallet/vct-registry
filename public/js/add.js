import { 
	getMetadataViewUrl,
	initialAddVctData,
	initializeEditor,
	onEditorContentChange,
	showErrors
} from "./app.js";
import { addUriIntegrityToEditor, getUriIntegrityPaths } from "./uri-integrity.js";

let editor;

const container = document.getElementById("jsoneditor");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, validateVct, initialAddVctData, onEditorContentChange);
	onEditorContentChange(initialAddVctData);
}

function validateVct(value) {
	const errors = [];

	for (const integrityPath of getUriIntegrityPaths(value)) {
		errors.push({
			path: integrityPath,
			message: "URI Integrity values are calculated on submission. This value will be overwritten."
		});
	}

	return errors;
}

document
	.getElementById("vct-submit-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to create this VC Type Metadata entry? SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.")) {
			return;
		}

		const editorData = editor.get();

		try {
			await addUriIntegrityToEditor(editor);
		} catch (error) {
			console.error("Error calculating URI integrity:", error);
			showErrors("Failed to create VC Type Metadata", { message: `Failed to calculate URI integrity. ${error.message}` });
			return;
		}

		const res = await fetch("vct/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				vct: editorData.vct,
				metadata: editorData,
			}),
		});

		const result = await res.json();
		if (!res.ok) {
			showErrors("Failed to create VC Type Metadata", result);
		} else {
			const redirectUrl = new URL(getMetadataViewUrl(editorData.vct), window.location.href);
			redirectUrl.searchParams.set("toast", "add-success");
			window.location.href = redirectUrl.toString();
		}
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
