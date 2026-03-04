import { decodeVct, fetchJson, initializeEditor, showErrors } from "./app.js";

let editor;
let vctUrn;

const container = document.getElementById("jsoneditor");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, validateVct);
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

	const vctIdContainer = document.getElementById("edit-vct-title");
	vctIdContainer.textContent = `Edit VCT ${metadata.vct}`;
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
			window.location.href = "/?toast=edit-success";
		}
	});

document
	.getElementById("vct-delete-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to delete this VC Type Metadata entry? This action is irreversible.")) {
			return;
		}

		const res = await fetch("vct/delete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				vct: vctUrn,
			}),
		});

		const result = await res.json();
		if (!res.ok) {
			showErrors("Failed to delete VC Type Metadata", result);
		} else {
			window.location.href = "/?toast=delete-success";
		}
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
