export async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}

/**
 * Handle a raw identifier string that may or may not be URL-encoded.
 * @param rawIdentifier
 * @returns decoded identifier string, or the original value if decoding fails
 */
export function decodeIdentifier(rawIdentifier) {
	let decodedIdentifier;
	try {
		decodedIdentifier = decodeURIComponent(rawIdentifier);
	} catch (decodingError) {
		console.warn('Error decoding identifier:', decodingError);
		console.warn('Using raw identifier string as-is.');
		decodedIdentifier = rawIdentifier;
	}

	return decodedIdentifier;
}

export function getMetadataViewUrl(identifier) {
	if (!identifier) return './metadata';
	return `./metadata?identifier=${encodeURIComponent(identifier)}`;
}

export async function initializeEditor(
	container,
	validationFn,
	initialData,
	onContentChange,
	format,
) {
	const [sdJwtVcSchema, mdocSchema] = await Promise.all([
		fetchJson('type-metadata/schema/dc+sd-jwt'),
		fetchJson('type-metadata/schema/mso_mdoc'),
	]);
	const schemas = { 'dc+sd-jwt': sdJwtVcSchema, mso_mdoc: mdocSchema };

	if (!Object.hasOwn(schemas, format))
		throw new Error('A supported metadata format is required.');

	const options = {
		mode: 'code',
		mainMenuBar: false,
		statusBar: false,
		schema: schemas[format],
		onValidate: validationFn,
		onValidationError: function (errors) {
			if (errors.length > 0) {
				document.querySelector('#registry-submit-btn').disabled = true;
			} else {
				document.querySelector('#registry-submit-btn').disabled = false;
			}
		},
		onChange() {
			if (typeof onContentChange === 'function') {
				try {
					onContentChange(editor.get());
				} catch {
					// Ignore transient invalid editor content while the user is typing.
				}
			}
		},
	};

	const editor = new JSONEditor(container, options);
	if (initialData) {
		editor.set(initialData);
	}
	const typeSelect = document.getElementById('metadata-type');
	if (typeSelect) {
		typeSelect.addEventListener('change', () => {
			if (typeSelect.disabled) return;
			editor.setSchema(schemas[typeSelect.value]);
			void editor.validate();
		});
	}
	return editor;
}

export async function requestMetadataPreview(metadata) {
	const res = await fetch('api/type-metadata/preview', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ metadata }),
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body?.message || 'Failed to generate preview.');
	}

	return res.json();
}

export async function copyTextToClipboard(text) {
	if (!navigator?.clipboard?.writeText) {
		throw new Error('Clipboard is not available in this browser.');
	}

	await navigator.clipboard.writeText(text);
}

export function initializeCopyButtons(selector = '[data-copy-target]') {
	const copyButtons = document.querySelectorAll(selector);

	copyButtons.forEach((button) => {
		button.addEventListener('click', async () => {
			const targetSelector = button.getAttribute('data-copy-target');
			const targetElement = targetSelector ? document.querySelector(targetSelector) : null;
			const originalLabel = button.getAttribute('aria-label') || 'Copy';

			if (!(targetElement instanceof HTMLElement)) {
				return;
			}

			try {
				await copyTextToClipboard(targetElement.innerText.trimEnd());
				button.classList.add('is-copied');
				button.setAttribute('aria-label', 'Copied');
				button.setAttribute('title', 'Copied');
			} catch {
				button.classList.remove('is-copied');
				button.setAttribute('aria-label', 'Copy failed');
				button.setAttribute('title', 'Copy failed');
			}

			window.setTimeout(() => {
				button.classList.remove('is-copied');
				button.setAttribute('aria-label', originalLabel);
				button.setAttribute('title', originalLabel);
			}, 1400);
		});
	});
}

export function showSuccess(message) {
	const successBox = document.getElementById('registry-success');
	successBox.hidden = false;
	successBox.textContent = message;

	setTimeout(() => {
		hideElement('registry-success');
	}, 5000);
}

export function showErrors(message, errors) {
	const errorBox = document.getElementById('registry-error');
	errorBox.hidden = false;
	errorBox.textContent = `${message}\nThe following errors were found:\n${errors.message}`;

	setTimeout(() => {
		hideElement('registry-error');
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

	const res = await fetch('auth/login', {
		credentials: 'include',
		headers: {
			...headers,
			'X-Requested-With': 'XMLHttpRequest',
		},
	});

	if (!res.ok) {
		throw new Error('Invalid username or password.');
	}
}

export async function logout() {
	try {
		await fetch('auth/logout', { credentials: 'include' });
	} catch {
		// Keep logout idempotent when the session or network is unavailable.
	}
}

export async function getAuthState() {
	try {
		const res = await fetch('auth', { credentials: 'include' });
		if (!res.ok) {
			return { loggedIn: false, username: '' };
		}

		const body = await res.json();
		return {
			loggedIn: true,
			username: body?.username ?? '',
		};
	} catch {
		return { loggedIn: false, username: '' };
	}
}

export const initialSdJwtVcMetadata = {
	vct: '',
	name: '',
	display: [{}],
	claims: [
		{
			path: ['vct'],
			mandatory: true,
			sd: 'never',
		},
	],
};

export const initialAddMdocData = {
	doctype: '',
	name: '',
	display: [{}],
	claims: [],
};

function updateMetadataDetails(metadata) {
	const identifierValue = document.querySelector('#edit-metadata-identifier-value code');
	const nameValue = document.getElementById('edit-metadata-name-value');
	const descriptionValue = document.getElementById('edit-metadata-description');

	if (!identifierValue || !nameValue || !descriptionValue) {
		return;
	}

	identifierValue.textContent = metadata?.vct || metadata?.doctype || '';
	nameValue.textContent = metadata?.name || '-';
	descriptionValue.textContent = metadata?.description || 'No description provided.';
}

function getMetadataPreviewTemplates(metadata) {
	return (
		metadata?.display?.flatMap(
			(display) =>
				display?.rendering?.svg_templates?.map((template) => ({
					uri: template.uri,
					properties: template.properties,
				})) ?? [],
		) ?? []
	);
}

function formatPreviewProperties(properties) {
	if (!properties) return '';

	const parts = [];
	if (properties.orientation) parts.push(properties.orientation);
	if (properties.color_scheme) parts.push(properties.color_scheme);
	if (properties.contrast) parts.push(`${properties.contrast} contrast`);

	return parts.join(' · ');
}

function renderPreview(metadata) {
	const previewList = document.getElementById('metadata-preview-list');
	const previewEmpty = document.getElementById('metadata-preview-empty');
	const previewTemplates = getMetadataPreviewTemplates(metadata);

	if (!previewList || !previewEmpty) {
		return;
	}

	if (previewTemplates.length) {
		previewList.replaceChildren(
			...previewTemplates.map((preview) => {
				const figure = document.createElement('figure');
				figure.className = 'metadata-preview-item';

				const image = document.createElement('img');
				image.className = 'metadata-preview';
				image.src = preview.uri;
				image.alt = `${metadata?.name || metadata?.vct || metadata?.doctype || 'Credential'} preview`;
				figure.appendChild(image);

				const captionText = formatPreviewProperties(preview.properties);
				if (captionText) {
					const caption = document.createElement('figcaption');
					caption.className = 'metadata-preview-caption';
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
