// knexfile.ts
import type { Knex } from "knex";
import { config } from "./config";

const knexConfig: Knex.Config = {
    client: "mysql2",
    connection: config.db_config.connection,
    migrations: {
        extension: "ts",
        directory: "./src/db/migrations",
    },
};

export default knexConfig;