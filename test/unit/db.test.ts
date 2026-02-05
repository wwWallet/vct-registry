import { app } from "../../src/server";
import request from "supertest";
import { config } from "../../config";
import { describe, it } from "vitest";
import { testVCTypeMetadata } from "../typeMetadata/testvct";

// describe("Frontend Authentication", () => {
//   it("GET /edit returns 401 when not authenticated", async () => {
//     await request(app)
//       .get("/edit")
//       .expect(401);
//   });

//   it("GET /edit returns 401 with wrong credentials", async () => {
//     await request(app)
//       .get("/edit")
//       .auth("fake_user", "wrong_password")
//       .expect(401);
//   });
  
//     it("GET /edit returns 200 when authenticated properly", async () => {
//     await request(app)
//       .get("/edit")
//       .auth(config.username, config.password)
//       .expect(200);
//   });

// });

// describe("API Authentication", () => {
//   it("POST /vct/create returns 401 when not authenticated", async () => {
//     await request(app)
//       .post("/vct/create")
//       .expect(401);
//   });

//   it("POST /vct/edit returns 401 when not authenticated", async () => {
//     await request(app)
//       .post("/vct/edit")
//       .expect(401);
//   });

//     it("POST /vct/delete returns 401 when not authenticated", async () => {
//     await request(app)
//       .post("/vct/delete")
//       .expect(401);
//   });

// });

// describe("Non-authenticated endpoints (for conformance)", () => {
//   it("GET /type-metadata/all returns 200 when not authenticated", async () => {
//     await request(app)
//       .get("/type-metadata/all")
//       .expect(200);
//   });

// });

describe("Get existing VCT", () => {
  it("GET /type-metadata?vct=vct_urn works", async () => {
    await request(app)
      .get("/type-metadata?vct=urn:credential:diploma")
      .expect(200);
  });

});

describe("Insert new VCT", () => {
  it("POST /vct/create works", async () => {

    console.log({
        vct: "urn:vct:test",
        metadata: JSON.stringify(testVCTypeMetadata)
      });

    await request(app)
      .post("/vct/create")
      .auth(config.username, config.password)
      .send({
        vct: "urn:vct:test",
        metadata: JSON.stringify(testVCTypeMetadata)
      })
      .expect(200);
  });

});

