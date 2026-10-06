import { resolve } from "node:path";
import nunjucks from "nunjucks";
import { describe, expect, it } from "vitest";

const views = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(resolve(__dirname, "../../src/views")),
	{ autoescape: true }
);

describe("Page titles", () => {
	it.each([undefined, null, ""])("uses a clean fallback when title and issuerName are %s", (value) => {
		const html = views.render("layouts/base.njk", { issuerName: value, title: value });
		expect(html).toContain("<title>VCT Registry</title>");
	});

	it("uses a clean fallback when both values are omitted", () => {
		const html = views.render("layouts/base.njk");
		expect(html).toContain("<title>VCT Registry</title>");
	});

	it.each([undefined, null, ""])("renders the usage title without an issuer name when it is %s", (issuerName) => {
		const html = views.render("pages/usage.njk", { issuerName });
		expect(html).toContain("<title>Usage - VCT Registry</title>");
	});

	it("uses the registry title when no prefix is provided", () => {
		const html = views.render("layouts/base.njk", { issuerName: "Example" });
		expect(html).toContain("<title>Example VCT Registry</title>");
	});

	it("omits the separator when the prefix is empty", () => {
		const html = views.render("layouts/base.njk", { issuerName: "Example", title: "" });
		expect(html).toContain("<title>Example VCT Registry</title>");
	});

	it("prepends an optional page title", () => {
		const html = views.render("layouts/base.njk", { issuerName: "Example", title: "Metadata" });
		expect(html).toContain("<title>Metadata - Example VCT Registry</title>");
	});

	it("uses the prefix set by the usage template", () => {
		const html = views.render("pages/usage.njk", { issuerName: "Example" });
		expect(html).toContain("<title>Usage - Example VCT Registry</title>");
	});

	it("escapes the prefix and issuer name", () => {
		const html = views.render("layouts/base.njk", { issuerName: "<Issuer>", title: "<Prefix>" });
		expect(html).toContain("<title>&lt;Prefix&gt; - &lt;Issuer&gt; VCT Registry</title>");
	});
});
