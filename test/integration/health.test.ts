import { app } from "../../src/server";
import request from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Health", () => {
  it("GET /api/health returns 200", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect(200)
      .expect("Content-Type", /json/);
    
    expect(response.body).toBeDefined();

    expect(response.body).toMatchObject({
      status: expect.stringMatching(/ok/),
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
  });

});

describe("Info", () => {

  it("GET /api/info returns app name", async () => {
    const response = await request(app)
      .get("/api/info")
      .expect(200)
      .expect("Content-Type", /json/);
      
    expect(response.body).toMatchObject({
      name: expect.stringMatching(/vct-registry/),
      version: expect.any(String),
      description: expect.any(String),
    });
    
  });

});

describe("Time", () => {
  beforeEach(() => {
    // Tell Vitest to mock the system clock
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore the real clock after each test
    vi.useRealTimers();
  });

  it("GET /api/time returns the exact mocked time", async () => {
    const mockDate = new Date("2026-01-01T12:00:00Z");
    vi.setSystemTime(mockDate);

    const response = await request(app)
      .get("/api/time")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      now: mockDate.toISOString(),
      timezone: expect.any(String)
    });
  });
});