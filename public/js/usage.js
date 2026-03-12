const copyButtons = document.querySelectorAll("[data-copy-code]");

copyButtons.forEach((button) => {
	button.addEventListener("click", async () => {
		const codeSelector = button.getAttribute("data-copy-code");
		const codeElement = codeSelector ? document.querySelector(codeSelector) : null;
		const originalLabel = button.getAttribute("aria-label") || "Copy example";

		if (!(codeElement instanceof HTMLElement)) {
			return;
		}

		try {
			await navigator.clipboard.writeText(codeElement.innerText.trimEnd());
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
