import { getAuthState, login, logout } from "./app.js";

const loginBtn = document.getElementById("vct-login-btn");
const logoutBtn = document.getElementById("vct-logout-btn");
const usernameContainer = document.getElementById("username-container");
const authDropdownWrapper = document.getElementById("vct-auth-dropdown-wrapper");
const authDropdown = document.getElementById("vct-auth-dropdown");
const authDropdownUsername = document.getElementById("vct-auth-dropdown-username");
const loginDialog = document.getElementById("vct-login-dialog");
const loginForm = document.getElementById("vct-login-form");
const loginCancelBtn = document.getElementById("vct-login-cancel-btn");
const loginSubmitBtn = document.getElementById("vct-login-submit-btn");
const loginUsernameInput = document.getElementById("vct-login-username");
const loginPasswordInput = document.getElementById("vct-login-password");
const loginError = document.getElementById("vct-login-error");

function dispatchCurrentAuthStateFromDom() {
	const loggedIn = !usernameContainer.hidden;
	document.dispatchEvent(new CustomEvent("auth:changed", {
		detail: {
			loggedIn,
			username: loggedIn ? (usernameContainer.dataset.username || "") : "",
		},
	}));
}

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

function closeAuthDropdown() {
	if (!authDropdown) {
		return;
	}
	authDropdown.hidden = true;
	usernameContainer.setAttribute("aria-expanded", "false");
}

function toggleAuthDropdown() {
	if (!authDropdown) {
		return;
	}
	authDropdown.hidden = !authDropdown.hidden;
	usernameContainer.setAttribute("aria-expanded", String(!authDropdown.hidden));
}

async function refreshHeaderAuthState() {
	const authState = await getAuthState();

	if (authState.loggedIn) {
		loginBtn.hidden = true;
		loginBtn.disabled = true;
		usernameContainer.hidden = false;
		authDropdownWrapper.hidden = false;
		authDropdown.hidden = true;
		usernameContainer.dataset.username = authState.username;
		authDropdownUsername.textContent = authState.username;
		usernameContainer.title = "";
		usernameContainer.setAttribute("aria-label", `Logged in as ${authState.username}`);
		usernameContainer.setAttribute("aria-expanded", "false");
		document.dispatchEvent(new CustomEvent("auth:changed", { detail: authState }));
		return;
	}

	loginBtn.hidden = false;
	loginBtn.disabled = false;
	usernameContainer.hidden = true;
	authDropdownWrapper.hidden = true;
	usernameContainer.removeAttribute("data-username");
	authDropdown.hidden = true;
	usernameContainer.title = "";
	usernameContainer.setAttribute("aria-label", "Logged in user");
	usernameContainer.setAttribute("aria-expanded", "false");
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

	usernameContainer.addEventListener("click", () => {
		toggleAuthDropdown();
	});

	usernameContainer.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			toggleAuthDropdown();
		}
	});

	document.addEventListener("click", (event) => {
		if (!authDropdown || authDropdown.hidden) {
			return;
		}

		if (!authDropdown.contains(event.target) && !usernameContainer.contains(event.target)) {
			closeAuthDropdown();
		}
	});

	logoutBtn.addEventListener("click", async () => {
		await logout();
		closeAuthDropdown();
		await refreshHeaderAuthState();
	});

	await refreshHeaderAuthState();
}

window.addEventListener("DOMContentLoaded", initializeHeaderAuth);
