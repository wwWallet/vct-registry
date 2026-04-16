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

export function getMetadataViewUrl(vct) {
	if (!vct) {
		return "./metadata";
	}

	return `./metadata?vct=${encodeURIComponent(vct)}`;
}

export async function initializeEditor(container, validationFn, initialData, onContentChange) {

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
		onChange() {
			if (typeof onContentChange === "function") {
				try {
					onContentChange(editor.get());
				} catch (_error) { }
			}
		},
	};

	const editor = new JSONEditor(container, options);
	if (initialData) {
		editor.set(initialData);
	}
	return editor;
}

export async function requestMetadataPreview(metadata) {
	const res = await fetch("vct/preview", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ metadata }),
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body?.message || "Failed to generate preview.");
	}

	return res.json();
}

export async function copyTextToClipboard(text) {
	if (!navigator?.clipboard?.writeText) {
		throw new Error("Clipboard is not available in this browser.");
	}

	await navigator.clipboard.writeText(text);
}

export function initializeCopyButtons(selector = "[data-copy-target]") {
	const copyButtons = document.querySelectorAll(selector);

	copyButtons.forEach((button) => {
		button.addEventListener("click", async () => {
			const targetSelector = button.getAttribute("data-copy-target");
			const targetElement = targetSelector ? document.querySelector(targetSelector) : null;
			const originalLabel = button.getAttribute("aria-label") || "Copy";

			if (!(targetElement instanceof HTMLElement)) {
				return;
			}

			try {
				await copyTextToClipboard(targetElement.innerText.trimEnd());
				button.classList.add("is-copied");
				button.setAttribute("aria-label", "Copied");
				button.setAttribute("title", "Copied");
			} catch (_error) {
				button.classList.remove("is-copied");
				button.setAttribute("aria-label", "Copy failed");
				button.setAttribute("title", "Copy failed");
			}

			window.setTimeout(() => {
				button.classList.remove("is-copied");
				button.setAttribute("aria-label", originalLabel);
				button.setAttribute("title", originalLabel);
			}, 1400);
		});
	});
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
	errorBox.textContent = `${message}\nThe following errors were found:\n${errors.message}`;

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

function updateMetadataDetails(metadata) {
	const vctIdValue = document.querySelector("#edit-vct-id-value code");
	const vctNameValue = document.getElementById("edit-vct-name-value");
	const descriptionValue = document.getElementById("edit-vct-description");

	if (!vctIdValue || !vctNameValue || !descriptionValue) {
		return;
	}

	vctIdValue.textContent = metadata?.vct || "";
	vctNameValue.textContent = metadata?.name || "-";
	descriptionValue.textContent =
		metadata?.description || "No description provided.";
}

function getMetadataPreviewTemplates(metadata) {
	return (
		metadata?.display?.flatMap((display) =>
			display?.rendering?.svg_templates?.map((template) => ({
				uri: template.uri,
				properties: template.properties,
			})) ?? [],
		) ?? []
	);
}

function formatPreviewProperties(properties) {
	if (!properties) return "";

	const parts = [];
	if (properties.orientation) parts.push(properties.orientation);
	if (properties.color_scheme) parts.push(properties.color_scheme);
	if (properties.contrast) parts.push(`${properties.contrast} contrast`);

	return parts.join(" · ");
}

function renderPreview(metadata) {
	const previewList = document.getElementById("metadata-preview-list");
	const previewEmpty = document.getElementById("metadata-preview-empty");
	const previewTemplates = getMetadataPreviewTemplates(metadata);

	if (!previewList || !previewEmpty) {
		return;
	}

	if (previewTemplates.length) {
		previewList.replaceChildren(
			...previewTemplates.map((preview) => {
				const figure = document.createElement("figure");
				figure.className = "metadata-preview-item";

				const image = document.createElement("img");
				image.className = "metadata-preview";
				image.src = preview.uri;
				image.alt = `${metadata?.name || metadata?.vct || "Credential"} preview`;
				figure.appendChild(image);

				const captionText = formatPreviewProperties(preview.properties);
				if (captionText) {
					const caption = document.createElement("figcaption");
					caption.className = "metadata-preview-caption";
					caption.textContent = captionText;
					figure.appendChild(caption);
				}

				return figure;
			}),
		);
		previewList.hidden = false;
		previewEmpty.hidden = true;
		return;
	}

	previewList.replaceChildren();
	previewList.hidden = true;
	previewEmpty.hidden = false;
}

export function onEditorContentChange(metadata) {
	updateMetadataDetails(metadata);
	renderPreview(metadata);
}

export async function calculateUriIntegrity(
	input,
	algorithm
) {
	let buffer;
	
	const response = await fetch(input);
	if (!response.ok) {
		throw new Error(`Failed to fetch URL: ${response.statusText}`);
	}
	buffer = await response.arrayBuffer();

	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
	return `${algorithm}-${hashBase64}`;
}