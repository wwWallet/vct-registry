import { Router } from "express";
import { auth, login, logout } from "../middleware/auth";

/** /auth */
const authRouter = Router();

authRouter.get('/', auth, (req, res) => {
	res.send({
		username: (req as any).username
	});
});

authRouter.get('/login', login, (req, res) => {
	res.send(`Logged in as ${(req as any).username}.`);
});

authRouter.get('/logout', (req, res) => {
	logout(req, res);
	res.send('Logged out successfully.');
});

export default authRouter;
