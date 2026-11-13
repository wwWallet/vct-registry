import { initializeCopyButtons, showSuccess } from './app.js';

const addBtn = document.getElementById('registry-add-btn');
const editBtn = document.getElementById('registry-edit-btn');
const deleteBtn = document.getElementById('registry-delete-btn');
const usernameContainer = document.getElementById('username-container');
const editValue = document.getElementById('registry-edit-value');

function updatePageAuthState(loggedIn) {
	addBtn.hidden = !loggedIn;
	editBtn.hidden = !loggedIn;
	if (deleteBtn) {
		deleteBtn.hidden = !loggedIn;
	}
}

function updateFromCurrentHeaderState() {
	const loggedIn = !usernameContainer.hidden;
	updatePageAuthState(loggedIn);
}

function checkSuccess() {
	const toast = new URLSearchParams(window.location.search).get('toast');

	switch (toast) {
		case 'add-success':
		case 'edit-success':
			showSuccess('Successfully saved type metadata.');
			break;
		case 'delete-success':
			showSuccess('Successfully deleted type metadata.');
			break;
		default:
			break;
	}
}

async function deleteSelectedMetadata() {
	const identifier = editValue?.value;
	if (!identifier) {
		return;
	}

	if (
		!confirm(
			'Are you sure you want to delete this type metadata entry? This action is irreversible.',
		)
	) {
		return;
	}

	const res = await fetch('api/type-metadata/delete', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identifier }),
	});

	const result = await res.json();
	if (!res.ok) {
		throw new Error(result?.message || 'Failed to delete type metadata.');
	}

	window.location.href = './metadata?toast=delete-success';
}

window.addEventListener('DOMContentLoaded', () => {
	updateFromCurrentHeaderState();
	checkSuccess();
	initializeCopyButtons();

	if (deleteBtn) {
		deleteBtn.addEventListener('click', async () => {
			try {
				await deleteSelectedMetadata();
			} catch (error) {
				const errorBox = document.getElementById('registry-error');
				if (errorBox) {
					errorBox.hidden = false;
					errorBox.textContent =
						error instanceof Error ? error.message : 'Failed to delete type metadata.';
				}
			}
		});
	}
});

document.addEventListener('auth:changed', (event) => {
	updatePageAuthState(Boolean(event.detail?.loggedIn));
});
