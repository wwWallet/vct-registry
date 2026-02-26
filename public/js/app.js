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

export async function initializeEditor(container, validationFn) {

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
	return editor;
}


export function showSuccess(message) {
	const successBox = document.getElementById("vct-success");
	successBox.hidden = false;
	successBox.textContent = `${message}. Redirecting to home page...`;

	setTimeout(() => {
		hideElement("vct-success");
		window.location.href = "/";
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

export async function login() {
	try {
        await fetch('login', { credentials: 'include' });
    } catch (_err) { }
}

export async function logout() {
	try {
		await fetch('logout', { credentials: 'include' });
	} catch (err) { }
}