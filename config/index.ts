import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export const config = {
	url: process.env.URL || "http://localhost:8097",
	port: process.env.PORT || "8097",
}
