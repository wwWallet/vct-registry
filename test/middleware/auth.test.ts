import { app } from "../../src/server";
import request from "supertest";
import { config } from "../../config";
import { describe, it } from "vitest";

describe("Frontend Authentication", () => {
	it("GET /edit returns 401 when not authenticated", async () => {
		await request(app)
			.get("/edit")
			.expect(302)
			.expect("Location", "/");
	});

	it("GET /edit returns 401 with wrong credentials", async () => {
		await request(app)
			.get("/edit")
			.auth("fake_user", "wrong_password")
			.expect(302)
			.expect("Location", "/");
	});

	it("GET /edit returns 200 when authenticated properly", async () => {

		const username = Object.keys(config.users)[0];
		const password = config.users[username];

		const agent = request.agent(app);

		await agent
			.get("/auth/login")
			.auth(username, password)
			.expect(200);

		await agent
			.get("/edit")
			.expect(200);
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
