import { initialAddVctData, initializeEditor, onEditorContentChange, requestMetadataPreview, showErrors } from "./app.js";

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
			window.location.href = "./metadata?toast=add-success";
		}
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
