import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export const config = {
	url: process.env.URL || "http://localhost:8097",
	port: process.env.PORT || "8097",
	users: {
		[process.env.ADMIN_USERNAME || "admin"]: process.env.ADMIN_PASSWORD || "admin",
	},
	db_config: {
		connection: {
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || "3307"),
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || 'root',
			database: process.env.DB_NAME || 'vct_registry',
		},
	}
}
