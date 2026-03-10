import { decodeVct, fetchJson, initializeEditor, requestMetadataPreview, showErrors } from "./app.js";

let editor;
let vctUrn;
let previewTimer;

const container = document.getElementById("jsoneditor");
const vctIdValue = document.querySelector("#edit-vct-id-value code");
const vctNameValue = document.getElementById("edit-vct-name-value");
const descriptionValue = document.getElementById("edit-vct-description");
const previewImage = document.getElementById("metadata-preview-image");
const previewEmpty = document.getElementById("metadata-preview-empty");

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

	return errors;
}

async function loadSelectedVct() {
	const params = new URLSearchParams(window.location.search);
	const value = params.get("vct"); // ?vct=urn:eudi:pid:1
	vctUrn = value;

	const encoded = encodeURIComponent(value);
	const fetchMetadataUrl = `type-metadata?vct=${encoded}`;

	const metadata = await fetchJson(fetchMetadataUrl);
	editor.set(metadata);
	updateMetadataDetails(metadata);
	queuePreviewUpdate(metadata);

	const vctIdContainer = document.getElementById("edit-vct-title");
	vctIdContainer.textContent = `Edit VCT ${metadata.vct}`;
}

function updateMetadataDetails(metadata) {
	vctIdValue.textContent = metadata?.vct || "";
	vctNameValue.textContent = metadata?.name || "-";
	descriptionValue.textContent = metadata?.description || "No description provided.";
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
		if (!confirm("Are you sure you want to edit this VC Type Metadata entry? This action is irreversible.")) {
			return;
		}

		const editorData = editor.get();

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
			window.location.href = "./metadata?toast=edit-success";
		}
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
