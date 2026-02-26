import { initializeEditor, showErrors, showSuccess } from "./app.js";

let editor;
let vctName = "";
let vctUrn = "";

const container = document.getElementById("jsoneditor");
const vctNameInput = document.getElementById("add-vct-name");
const vctIdInput = document.getElementById("add-vct-id");

async function initializeEditorAndLoadVct() {
	editor = await initializeEditor(container, validateInputs);
}

container.addEventListener("paste", () => {

	// Sanitize duplicate json start
	const text = editor.getText();
	if (text.startsWith("{}{")) {
		editor.setText(text.substring(2));
	}

	try {
		const content = editor.get();

		if (content.vct) {
			vctIdInput.value = content.vct;
		}
		if (content.name) {
			vctNameInput.value = content.name;
		}
	} catch (_failedToParseJsonInput) { }
});

function validateInputs(value) {

	const errors = [];

	const vctUrn = vctIdInput.value.trim();
	if (vctUrn && value.vct != vctUrn) {
		errors.push({
        path: ["vct"],
        message: "VCT URN value must match the URN provided in the input field.",
      });
	}

	const vctName = vctNameInput.value;
	if (vctName && value.name != vctName) {
		errors.push({
        path: ["name"],
        message: "VCT name value must match the name provided in the input field.",
      });
	}

	return errors;
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
				vct: vctUrn,
				metadata: editorData,
			}),
		});

		const result = await res.json();
		if (!res.ok) {
			showErrors("Failed to create VC Type Metadata", result);
		} else {
			showSuccess("Successfully created VC Type Metadata");
		}
	});

vctNameInput
	.addEventListener("input", (nameInput) => {
		vctName = nameInput.target.value;

		const editorData = editor.get();
		editorData.name = vctName;
		editor.set(editorData);
	});

vctIdInput
	.addEventListener("input", (vctInput) => {
		vctUrn = vctInput.target.value.trim();

		const editorData = editor.get();
		editorData.vct = vctUrn;
		editor.set(editorData);
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
