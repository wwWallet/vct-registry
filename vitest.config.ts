import { defineConfig } from "vitest/config";
import * as dotenv from "dotenv";

export default defineConfig({
  test: {
    env: dotenv.config({ path: '.env.test' }).parsed as any,
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    pool: "forks", // avoid issues with shared DB state in tests
    testTimeout: 20000
  }
});
