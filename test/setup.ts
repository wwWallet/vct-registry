// test/setup.ts
import "dotenv/config";
import { beforeAll, beforeEach, afterAll } from "vitest";

import { db } from "../src/server";
import { resetDatabase } from "./helpers/db";

beforeAll(async () => {
  // sanity check to avoid nuking dev/prod
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Tests must run with NODE_ENV=test");
  }
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await db.destroy();
});
