import { decodeVct, fetchJson } from "./app.js";

async function initializeEditorAndLoadVct() {
	await initializeEditor();
	await loadSelectedVct();
}

async function initializeEditor() {
	const container = document.getElementById("jsoneditor");

	var schema = await fetchJson("/type-metadata/schema");

	const options = {
		mode: "code",
		mainMenuBar: false,
		statusBar: false,
		schema: schema,
		onValidate: validateUrn,
		onValidationError: function (errors) {
			if (errors.length > 0) {
				document.querySelector("#vct-submit-btn").disabled = true;
			} else {
				document.querySelector("#vct-submit-btn").disabled = false;
			}
		},
	};

	editor = new JSONEditor(container, options);
}

function validateUrn(value) {

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
	const fetchMetadataUrl = `/type-metadata?vct=${encoded}`;

	const metadata = await fetchJson(fetchMetadataUrl);
	editor.set(metadata);

	const nameContainer = document.getElementById("selected-vct-name");
	nameContainer.textContent = metadata.name;
}

document
	.getElementById("vct-submit-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to edit this VC Type Metadata entry? This action is irreversible.")) {
			return;
		}

		const editorData = editor.get();

		const res = await fetch("/vct/edit", {
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
			showSuccess("Successfully saved VC Type Metadata");
		}
	});

document
	.getElementById("vct-delete-btn")
	.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to delete this VC Type Metadata entry? This action is irreversible.")) {
			return;
		}

		const res = await fetch("/vct/delete", {
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
			showSuccess("Successfully deleted VC Type Metadata");
		}
	});

function showSuccess(message) {
	const successBox = document.getElementById("vct-success");
	successBox.hidden = false;
	successBox.textContent = `${message}. Redirecting to home page...`;

	setTimeout(() => {
		hideElement("vct-success");
		window.location.href = "/";
	}, 5000);
}

function showErrors(message, errors) {
	// TODO vmarkop contemplate adding custom JSONEditor validation errors

	const errorBox = document.getElementById("vct-error");
	errorBox.hidden = false;
	errorBox.textContent = `${message}. The following errors were found:
  ${JSON.stringify(errors)}`;

	setTimeout(() => {
		hideElement("vct-error");
	}, 5000);
}

function hideElement(elementId) {
	const element = document.getElementById(elementId);
	element.hidden = true;
}

let editor;
let vctUrn;
window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
