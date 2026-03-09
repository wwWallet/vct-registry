export function clearEl(el) {
	el.replaceChildren();
}

export async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}

/**
 * Handle a raw VCT string that may or may not be URL-encoded.
 * @param rawVct
 * @returns decoded VCT string, or undefined if input is invalid
 */
export function decodeVct(rawVct) {
	let decodedVct;
	try {
		decodedVct = decodeURIComponent(rawVct);
	} catch (decodingError) {
		console.warn("Error decoding VCT:", decodingError);
		console.warn("Using raw VCT string as-is.");
		decodedVct = rawVct;
	}

	return decodedVct;
}

export async function initializeEditor(container, validationFn, initialData) {

	var schema = await fetchJson("type-metadata/schema");

	const options = {
		mode: "code",
		mainMenuBar: false,
		statusBar: false,
		schema: schema,
		onValidate: validationFn,
		onValidationError: function (errors) {
			if (errors.length > 0) {
				document.querySelector("#vct-submit-btn").disabled = true;
			} else {
				document.querySelector("#vct-submit-btn").disabled = false;
			}
		},
	};

	const editor = new JSONEditor(container, options);
	if (initialData) {
		editor.set(initialData);
	}
	return editor;
}


export function showSuccess(message) {
	const successBox = document.getElementById("vct-success");
	successBox.hidden = false;
	successBox.textContent = message;

	setTimeout(() => {
		hideElement("vct-success");
	}, 5000);
}

export function showErrors(message, errors) {
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

export async function login(username, password) {
	const headers = {};

	if (username && password) {
		headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
	}

	const res = await fetch("auth/login", {
		credentials: "include",
		headers: {
			...headers,
			"X-Requested-With": "XMLHttpRequest",
		},
	});

	if (!res.ok) {
		throw new Error("Invalid username or password.");
	}
}

export async function logout() {
	try {
		await fetch('auth/logout', { credentials: 'include' });
	} catch (err) { }
}

export async function getAuthState() {
	try {
		const res = await fetch("auth", { credentials: "include" });
		if (!res.ok) {
			return { loggedIn: false, username: "" };
		}

		const body = await res.json();
		return {
			loggedIn: true,
			username: body?.username ?? "",
		};
	} catch (_err) {
		return { loggedIn: false, username: "" };
	}
}

export const initialAddVctData = {
	"vct": "",
	"name": "",
	"display": [
		{
		}
	],
	"claims": [
		{
			"path": [
				"vct"
			],
			"mandatory": true,
			"sd": "never"
		}
	]
}
