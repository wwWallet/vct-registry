import { 
	getMetadataViewUrl,
	initialAddVctData,
	initializeEditor,
	onEditorContentChange,
	showErrors
} from "./app.js";
import { addUriIntegrityToEditor } from "./uri-integrity.js";

let editor;

const container = document.getElementById("jsoneditor");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, undefined, initialAddVctData, onEditorContentChange);
	onEditorContentChange(initialAddVctData);
}

document
	.getElementById("vct-submit-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to create this VC Type Metadata entry?")) {
			return;
		}

		const editorData = editor.get();

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

document
	.getElementById("calculate-integrity-btn")
	.addEventListener("click", async () => {
		addUriIntegrityToEditor(editor);
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
