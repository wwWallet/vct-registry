import { clearEl, fetchJson, login, logout, showSuccess } from "./app.js";

const loginBtn = document.getElementById('vct-login-btn');
const logoutBtn = document.getElementById('vct-logout-btn');
const addBtn = document.getElementById('vct-add-btn');
const editBtn = document.getElementById('vct-edit-btn');
const usernameContainer = document.getElementById('username-container');

function appUrl(path) {
	return new URL(path, document.baseURI).toString();
}

loginBtn.addEventListener('click', async () => {
	await login();
	await checkLogin();
});

logoutBtn.addEventListener('click', async () => {
	await logout();
	await checkLogin();
});

async function onLoad() {
	loadVctList();
	checkLogin();
	checkSuccess();
}

function addMetaRow(container, label, value, { code = false } = {}) {
	const row = document.createElement('div');

	const strong = document.createElement('strong');
	strong.textContent = label;

	row.append(strong, ' ');

	if (code) {
		const codeEl = document.createElement('code');
		codeEl.textContent = String(value ?? '');
		row.append(codeEl);
	} else {
		row.append(document.createTextNode(String(value ?? '')));
	}

	container.appendChild(row);
}

async function loadVctList() {
	const loading = document.getElementById("vct-loading");
	const controls = document.getElementById("vct-controls");
	const errorBox = document.getElementById("vct-error");
	const select = document.getElementById("vct-select");
	const metaBox = document.getElementById("vct-meta");
	const dataBox = document.getElementById("vct-data");
	const sourceBox = document.getElementById("vct-source");
	const editBox = document.getElementById("vct-edit");

	loading.hidden = false;
	controls.hidden = true;
	errorBox.hidden = true;
	editBox.hidden = true;
	errorBox.textContent = "";
	clearEl(select);
	clearEl(metaBox);
	dataBox.textContent = "";
	sourceBox.textContent = "";

	try {
		const list = await fetchJson(appUrl("api/vct")); // [{ vct, name }]

		if (!Array.isArray(list) || list.length === 0) {
			loading.hidden = true;
			errorBox.hidden = false;
			errorBox.textContent = "No VCT entries found.";
			return;
		}

		// "(All metadata)" first
		const allOpt = document.createElement("option");
		allOpt.value = "__all__";
		allOpt.textContent = "(All metadata)";
		select.appendChild(allOpt);

		// Add actual VCT entries
		for (const entry of list) {
			const opt = document.createElement("option");
			opt.value = entry.vct;
			opt.textContent = `${entry.name} (${entry.vct})`;
			select.appendChild(opt);
		}

		loading.hidden = true;

		// Default to showing ALL
		select.value = "__all__";
		await loadVctSelection(select.value);

		controls.hidden = false;

		select.addEventListener("change", async () => {
			await loadVctSelection(select.value);
		});
	} catch (err) {
		console.error("Error loading VCT list:", err);
		loading.hidden = false;
		errorBox.hidden = false;
		errorBox.textContent = `Failed to load VCT list: ${err.message}`;
	}
}

async function loadVctSelection(value) {
	const errorBox = document.getElementById("vct-error");
	const metaBox = document.getElementById("vct-meta");
	const dataBox = document.getElementById("vct-data");
	const sourceBox = document.getElementById("vct-source");
	const editBox = document.getElementById("vct-edit");

	const editValue = document.getElementById("vct-edit-value");

	errorBox.hidden = true;
	clearEl(metaBox);
	dataBox.textContent = "Loading…";
	sourceBox.textContent = "";
	editBox.hidden = true;

	try {
		if (value === "__all__") {
			const url = appUrl("type-metadata/all");
			const all = await fetchJson(url);
			sourceBox.textContent = `Source: GET ${url}`;

			clearEl(metaBox);
			addMetaRow(metaBox, 'Showing:', 'All metadata entries');
			addMetaRow(metaBox, 'Total entries:', all.length);

			dataBox.textContent = JSON.stringify(all, null, 2);
			return;
		}

		const encoded = encodeURIComponent(value);
		const fetchUrl = appUrl(`type-metadata?vct=${encoded}`);
		sourceBox.textContent = `Source: GET ${fetchUrl}`;

		const metadata = await fetchJson(fetchUrl);

		clearEl(metaBox);
		addMetaRow(metaBox, 'VCT:', value, { code: true });
		addMetaRow(metaBox, 'Name:', metadata.name);

		if (metadata.description) {
			addMetaRow(metaBox, 'Description:', metadata.description);
		}

		editBox.hidden = false;
		editValue.value = encoded;

		dataBox.textContent = JSON.stringify(metadata, null, 2);
	} catch (err) {
		errorBox.hidden = false;
		errorBox.textContent = `Failed to load metadata: ${err.message}`;
		dataBox.textContent = "";
		sourceBox.textContent = "";
	}
}

async function checkLogin() {
	try {
        const res = await fetch(appUrl("auth"), { credentials: 'include' });
        if (res.ok) {
			loginBtn.disabled = true;
			logoutBtn.disabled = false;
			addBtn.hidden = false;
			editBtn.hidden = false;
			const body = await res.json();
			usernameContainer.textContent = `Logged in as ${body.username}`;
			return;
        }
    } catch (_err) { }
	loginBtn.disabled = false;
	logoutBtn.disabled = true;
	addBtn.hidden = true;
	editBtn.hidden = true;
	usernameContainer.textContent = "";
}

async function checkSuccess() {
	const toast = new URLSearchParams(window.location.search).get("toast");

	switch (toast) {
		case "add-success":
		case "edit-success":
			showSuccess("Successfully saved VC Type Metadata.");
			break;
		case "delete-success":
			showSuccess("Successfully deleted VC Type Metadata.");
			break;
		default:
			break;
	}
}

window.addEventListener("DOMContentLoaded", onLoad);
