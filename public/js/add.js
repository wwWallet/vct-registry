import { initialAddVctData, initializeEditor, requestMetadataPreview, showErrors } from "./app.js";

let editor;
let previewTimer;

const container = document.getElementById("jsoneditor");
const vctIdValue = document.querySelector("#add-vct-id-value code");
const vctNameValue = document.getElementById("add-vct-name-value");
const descriptionOutput = document.getElementById("add-vct-description");
const previewImage = document.getElementById("metadata-preview-image");
const previewEmpty = document.getElementById("metadata-preview-empty");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, validateInputs, initialAddVctData, onEditorContentChange);
	updateMetadataDetails(initialAddVctData);
	queuePreviewUpdate(initialAddVctData);
}

container.addEventListener("paste", () => {
	const text = editor.getText();
	if (text.startsWith("{}{")) {
		editor.setText(text.substring(2));
	}
});

function validateInputs(value) {
	const errors = [];

	if (!value.vct) {
		errors.push({
			path: ["vct"],
			message: "VCT URN cannot be empty.",
		});
	}

	return errors;
}

function updateMetadataDetails(metadata) {
	vctIdValue.textContent = metadata?.vct || "";
	vctNameValue.textContent = metadata?.name || "-";
	descriptionOutput.textContent = metadata?.description || "No description provided yet.";
}

function renderPreview(dataUri) {
	if (dataUri) {
		previewImage.src = dataUri;
		previewImage.hidden = false;
		previewEmpty.hidden = true;
		return;
	}

	previewImage.hidden = true;
	previewImage.removeAttribute("src");
	previewEmpty.hidden = false;
}

function queuePreviewUpdate(metadata) {
	clearTimeout(previewTimer);
	previewTimer = setTimeout(async () => {
		try {
			const result = await requestMetadataPreview(metadata);
			renderPreview(result.dataUri || null);
		} catch (_error) {
			renderPreview(null);
		}
	}, 180);
}

function onEditorContentChange(metadata) {
	updateMetadataDetails(metadata);
	queuePreviewUpdate(metadata);
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
