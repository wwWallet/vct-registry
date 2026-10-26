export {};

declare global {
	namespace Express {
		interface Request {
			auth?: {
				username: string;
			};
		}
	}
}
