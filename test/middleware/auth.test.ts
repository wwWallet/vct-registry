import { app } from "../../src/server";
import request from "supertest";
import { config } from "../../config";
import { describe, expect, it } from "vitest";

describe("Frontend Authentication", () => {
	it("GET /edit redirects to the registry when not authenticated", async () => {
		await request(app)
			.get("/edit")
			.expect(302)
			.expect("Location", config.url);
	});

	it("GET /edit redirects to the registry with wrong credentials", async () => {
		await request(app)
			.get("/edit")
			.auth("fake_user", "wrong_password")
			.expect(302)
			.expect("Location", config.url);
	});

	it("GET /edit returns 200 when authenticated properly", async () => {

		const username = Object.keys(config.users)[0];
		const password = config.users[username];

		const agent = request.agent(app);

		await agent
			.get("/auth/login")
			.auth(username, password)
			.expect(200);

		const response = await agent
			.get("/edit")
			.expect(200);

		expect(response.text).toContain(`<a class="header-brand" href="${config.url}">`);
		expect(response.text).toContain(`alt="${config.wallet_name} logo"`);
		expect(response.text).toContain(`<p class="header-kicker">${config.wallet_name}</p>`);
	});
});

describe("API Authentication", () => {
	it("POST /vct/create returns 401 when not authenticated", async () => {
		await request(app).post("/vct/create").expect(401);
	});

	it("POST /vct/edit returns 401 when not authenticated", async () => {
		await request(app).post("/vct/edit").expect(401);
	});

	it("POST /vct/delete returns 401 when not authenticated", async () => {
		await request(app).post("/vct/delete").expect(401);
	});
});

describe("Non-authenticated endpoints (for conformance)", () => {
	it("GET /type-metadata/all returns 200 when not authenticated", async () => {
		await request(app).get("/type-metadata/all").expect(200);
	});
});
