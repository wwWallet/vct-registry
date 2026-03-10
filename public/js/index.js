import { showSuccess } from "./app.js";

const addBtn = document.getElementById("vct-add-btn");
const editBtn = document.getElementById("vct-edit-btn");
const deleteBtn = document.getElementById("vct-delete-btn");
const usernameContainer = document.getElementById("username-container");
const editValue = document.getElementById("vct-edit-value");

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

async function deleteSelectedVct() {
	const vct = editValue?.value;
	if (!vct) {
		return;
	}

	if (!confirm("Are you sure you want to delete this VC Type Metadata entry? This action is irreversible.")) {
		return;
	}

	const res = await fetch("vct/delete", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ vct }),
	});

	const result = await res.json();
	if (!res.ok) {
		throw new Error(result?.message || "Failed to delete VC Type Metadata.");
	}

	window.location.href = "./metadata?toast=delete-success";
}

window.addEventListener("DOMContentLoaded", () => {
	updateFromCurrentHeaderState();
	checkSuccess();

	if (deleteBtn) {
		deleteBtn.addEventListener("click", async () => {
			try {
				await deleteSelectedVct();
			} catch (error) {
				const errorBox = document.getElementById("vct-error");
				if (errorBox) {
					errorBox.hidden = false;
					errorBox.textContent = error instanceof Error ? error.message : "Failed to delete VC Type Metadata.";
				}
			}
		});
	}
});

document.addEventListener("auth:changed", (event) => {
	updatePageAuthState(Boolean(event.detail?.loggedIn));
});
