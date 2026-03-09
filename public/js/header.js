import { getAuthState, login, logout } from "./app.js";

const loginBtn = document.getElementById("vct-login-btn");
const logoutBtn = document.getElementById("vct-logout-btn");
const usernameContainer = document.getElementById("username-container");
const loginDialog = document.getElementById("vct-login-dialog");
const loginForm = document.getElementById("vct-login-form");
const loginCancelBtn = document.getElementById("vct-login-cancel-btn");
const loginSubmitBtn = document.getElementById("vct-login-submit-btn");
const loginUsernameInput = document.getElementById("vct-login-username");
const loginPasswordInput = document.getElementById("vct-login-password");
const loginError = document.getElementById("vct-login-error");

function openLoginDialog() {
	loginError.hidden = true;
	loginError.textContent = "";
	loginForm.reset();

	if (typeof loginDialog.showModal === "function") {
		loginDialog.showModal();
	} else {
		loginDialog.setAttribute("open", "");
	}

	loginUsernameInput.focus();
}

function closeLoginDialog() {
	if (typeof loginDialog.close === "function") {
		loginDialog.close();
	} else {
		loginDialog.removeAttribute("open");
	}
}

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
	loginBtn.addEventListener("click", () => {
		openLoginDialog();
	});

	loginCancelBtn.addEventListener("click", () => {
		closeLoginDialog();
	});

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		loginSubmitBtn.disabled = true;
		loginError.hidden = true;

		try {
			await login(loginUsernameInput.value.trim(), loginPasswordInput.value);
			closeLoginDialog();
			await refreshHeaderAuthState();
		} catch (err) {
			loginError.textContent = err.message || "Login failed.";
			loginError.hidden = false;
		} finally {
			loginSubmitBtn.disabled = false;
		}
	});

	loginDialog.addEventListener("click", (event) => {
		if (event.target === loginDialog) {
			closeLoginDialog();
		}
	});

	logoutBtn.addEventListener("click", async () => {
		await logout();
		await refreshHeaderAuthState();
	});

	await refreshHeaderAuthState();
}

window.addEventListener("DOMContentLoaded", initializeHeaderAuth);
