import { getAuthState, login, logout } from "./app.js";

const loginBtn = document.getElementById("vct-login-btn");
const logoutBtn = document.getElementById("vct-logout-btn");
const usernameContainer = document.getElementById("username-container");

async function refreshHeaderAuthState() {
	const authState = await getAuthState();

	if (authState.loggedIn) {
		loginBtn.hidden = true;
		loginBtn.disabled = true;
		logoutBtn.hidden = false;
		logoutBtn.disabled = false;
		usernameContainer.hidden = false;
		usernameContainer.dataset.username = authState.username;
		usernameContainer.title = "";
		usernameContainer.setAttribute("aria-label", `Logged in as ${authState.username}`);
		document.dispatchEvent(new CustomEvent("auth:changed", { detail: authState }));
		return;
	}

	loginBtn.hidden = false;
	loginBtn.disabled = false;
	logoutBtn.hidden = true;
	logoutBtn.disabled = true;
	usernameContainer.hidden = true;
	usernameContainer.removeAttribute("data-username");
	usernameContainer.title = "";
	usernameContainer.setAttribute("aria-label", "Logged in user");
	document.dispatchEvent(new CustomEvent("auth:changed", { detail: authState }));
}

async function initializeHeaderAuth() {
	loginBtn.addEventListener("click", async () => {
		await login();
		await refreshHeaderAuthState();
	});

	logoutBtn.addEventListener("click", async () => {
		await logout();
		await refreshHeaderAuthState();
	});

	await refreshHeaderAuthState();
}

window.addEventListener("DOMContentLoaded", initializeHeaderAuth);
