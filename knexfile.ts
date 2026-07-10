import type { Knex } from "knex";
import path from "path";
import { config } from "./config";

const knexConfig: Knex.Config = {
    client: "mysql2",
    connection: config.db_config.connection,
    migrations: {
        extension: path.extname(__filename).slice(1) || "js",
        directory: path.join(__dirname, "src", "db", "migrations"),
    },
};

export default knexConfig;
