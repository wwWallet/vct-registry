import { showSuccess } from "./app.js";

const addBtn = document.getElementById("vct-add-btn");
const editBtn = document.getElementById("vct-edit-btn");
const usernameContainer = document.getElementById("username-container");

function updatePageAuthState(loggedIn) {
	addBtn.hidden = !loggedIn;
	editBtn.hidden = !loggedIn;
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

window.addEventListener("DOMContentLoaded", () => {
	updateFromCurrentHeaderState();
	checkSuccess();
});

document.addEventListener("auth:changed", (event) => {
	updatePageAuthState(Boolean(event.detail?.loggedIn));
});
