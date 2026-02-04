import { fetchJson } from './app.js';

async function initializeEditorAndLoadVct() {
  await initializeEditor();
  await loadSelectedVct();
}

async function initializeEditor() {
  const container = document.getElementById("jsoneditor");

  var schema = await fetchJson('/type-metadata/schema');

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
  vctUrn = value;

	const encoded = encodeURIComponent(value);
	const fetchMetadataUrl = `/type-metadata?vct=${encoded}`;

	const metadata = await fetchJson(fetchMetadataUrl);
	editor.set(metadata)

	const nameContainer = document.getElementById("selected-vct-name");
	nameContainer.textContent = metadata.name;
}

document.getElementById('vct-submit-btn').addEventListener('click', async () => {
  const editorData = editor.get();

  const res = await fetch('/vct/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vct: vctUrn,
      metadata: editorData
    })
  });

  const result = await res.json();
  if (!res.ok) {
    showErrors(result);
  } else {
    showSuccess();
  }
});

function showSuccess() {
  const successBox = document.getElementById('vct-success');
  successBox.hidden = false;
  successBox.textContent = `Successfully saved Type Metadata. Redirecting to home page...`;

  setTimeout(() => {
    hideElement('vct-success');
    window.location.href = '/';
  }, 5000);
}

function hideElement(elementId) {
  const element = document.getElementById(elementId);
  element.hidden = true;
}


function showErrors(errors) {
  // TODO vmarkop contemplate adding custom JSONEditor validation errors

  const errorBox = document.getElementById('vct-error');
  errorBox.hidden = false;
  errorBox.textContent = `Cannot save Type Metadata. The following errors were found:
  ${JSON.stringify(errors)}`;

  setTimeout(() => {
    hideElement('vct-error');
  }, 5000);
}


let editor;
let vctUrn;
window.addEventListener('DOMContentLoaded', initializeEditorAndLoadVct);