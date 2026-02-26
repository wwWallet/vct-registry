import { fetchJson } from "./app.js";


let editor;
let vctName = "";
let vctUrn = "";

const container = document.getElementById("jsoneditor");
const vctNameInput = document.getElementById("add-vct-name");
const vctIdInput = document.getElementById("add-vct-id");

async function initializeEditorAndLoadVct() {
	await initializeEditor();
}

async function initializeEditor() {

	var schema = await fetchJson("type-metadata/schema");

	const options = {
		mode: "code",
		mainMenuBar: false,
		statusBar: false,
		schema: schema,
		onValidate: validateInputs,
		onValidationError: function (errors) {
			if (errors.length > 0) {
				document.querySelector("#vct-submit-btn").disabled = true;
			} else {
				document.querySelector("#vct-submit-btn").disabled = false;
			}
		},
	};

	editor = new JSONEditor(container, options);
	editor.set();
}

container.addEventListener("paste", () => {
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
	const errorBox = document.getElementById("vct-error");
	errorBox.hidden = false;
	errorBox.textContent = `${message}.
		The following errors were found:
		${errors.message}`;

	setTimeout(() => {
		hideElement("vct-error");
	}, 5000);
}

function hideElement(elementId) {
	const element = document.getElementById(elementId);
	element.hidden = true;
}

vctNameInput
	.addEventListener("input", (nameInput) => {
		vctName = nameInput.target.value;

		const json = editor.get();
		json.name = vctName;
		editor.set(json);
	});

vctIdInput
	.addEventListener("input", (vctInput) => {
		vctUrn = vctInput.target.value.trim();

		const editorData = editor.get();
		editorData.vct = vctUrn;
		editor.set(editorData);
	});

window.addEventListener("DOMContentLoaded", initializeEditorAndLoadVct);
