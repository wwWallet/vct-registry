import { Router } from 'express';
import { auth, login, logout } from '../middleware/auth';

/** /auth */
const authRouter = Router();

authRouter.get('/', auth, (req, res) => {
	res.send({
		username: req.auth?.username,
	});
});

authRouter.get('/login', login, (req, res) => {
	res.send(`Logged in as ${req.auth?.username}.`);
});

authRouter.get('/logout', (req, res) => {
	logout(req, res);
	res.send('Logged out successfully.');
});

export default authRouter;
