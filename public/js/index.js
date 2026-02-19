import { clearEl, fetchJson, login, logout } from "./app.js";

const loginBtn = document.getElementById('vct-login-btn');
const logoutBtn = document.getElementById('vct-logout-btn');
const editBtn = document.getElementById('vct-edit-btn');
const usernameContainer = document.getElementById('username-container');

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
	select.replaceChildren();
	metaBox.replaceChildren();
	dataBox.textContent = "";
	sourceBox.textContent = "";

	try {
		const list = await fetchJson("api/vct"); // [{ vct, name }]

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

		// On change
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
	metaBox.replaceChildren();
	dataBox.textContent = "Loading…";
	sourceBox.textContent = "";
	editBox.hidden = true;

	try {
		const { origin, pathname } = window.location; // dynamic domain

		if (value === "__all__") {
			const url = "type-metadata/all";
			const all = await fetchJson(url);

			const fullUrl = `${origin}${pathname}${url}`; // http://localhost:5001/type-metadata/all
			sourceBox.textContent = `Source: GET ${fullUrl}`;

			clearEl(metaBox);
			addMetaRow(metaBox, 'Showing:', 'All metadata entries');
			addMetaRow(metaBox, 'Total entries:', all.length);

			dataBox.textContent = JSON.stringify(all, null, 2);
			return;
		}

		const encoded = encodeURIComponent(value);
		const fetchUrl = `type-metadata?vct=${encoded}`;

		// Display pretty full URL with domain + decoded VCT
		const displayUrl = `${origin}${pathname}type-metadata?vct=${value}`;
		sourceBox.textContent = `Source: GET ${displayUrl}`;

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
        const res = await fetch('auth', { credentials: 'include' });
        if (res.ok) {
			loginBtn.disabled = true;
			logoutBtn.disabled = false;
			editBtn.disabled = false;
			const body = await res.json();
			usernameContainer.textContent = `Logged in as ${body.username}`;
			return;
        }
    } catch (_err) { }
	// else
	loginBtn.disabled = false;
	logoutBtn.disabled = true;
	editBtn.disabled = true;
	usernameContainer.textContent = "";
}

window.addEventListener("DOMContentLoaded", onLoad);

