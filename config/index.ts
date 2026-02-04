import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export const config = {
	url: process.env.URL || "http://localhost:8097",
	port: process.env.PORT || "8097",
	username: "admin",
	password: "admin",
	db_config: {
		client: 'mysql',
		connection: {
			host: 'localhost',
			port: 3307,
			user: 'root',
			password: 'root',
			database: 'vct_registry',
		},
	}
}
