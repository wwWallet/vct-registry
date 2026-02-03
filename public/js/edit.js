import { fetchJson } from './app.js';

async function initializeEditorAndLoadVct() {
  await initializeEditor();
  await loadSelectedVct();
}

async function initializeEditor() {
  const container = document.getElementById("jsoneditor");

  var schema = await fetchJson('/type-metadata/schema');

  delete schema.$schema;  // JSONEditor can't handle $schema refs, remove it
  // schema.additionalProperties = true; // TODO vmarkop do we want this?

  const options = {
    mode: "code",
    mainMenuBar: false,
    statusBar: false,
    schema: schema,
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

async function loadSelectedVct() {
	const params = new URLSearchParams(window.location.search);
	const value = params.get('vct'); // ?vct=urn:eudi:pid:1

	const encoded = encodeURIComponent(value);
	const fetchMetadataUrl = `/type-metadata?vct=${encoded}`;

	const metadata = await fetchJson(fetchMetadataUrl);
	editor.set(metadata)

	const nameContainer = document.getElementById("selected-vct-name");
	nameContainer.textContent = metadata.name;
}

document.getElementById('vct-submit-btn').addEventListener('click', async () => {
  const data = editor.get();

  const res = await fetch('/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (!res.ok) {
    showErrors(result.errors); // inline validation
  } else {
    showSuccess(result.message); // success toast
  }
});

// TODO vmarkop implement UI feedback (or skip to saving)
function showSuccess(message) {
  console.log('success! ', message);
}

// TODO vmarkop implement UI form control
function showErrors(errors) {
  console.log('errors: ', errors);
}


let editor;
window.addEventListener('DOMContentLoaded', initializeEditorAndLoadVct);