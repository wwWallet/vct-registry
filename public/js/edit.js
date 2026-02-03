import { fetchJson } from './app.js';

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

const container = document.getElementById("jsoneditor");

var schema = JSON.stringify(schema);  // TODO vmarkop load schema from file

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

const editor = new JSONEditor(container, options);

window.addEventListener('DOMContentLoaded', loadSelectedVct);