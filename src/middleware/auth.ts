import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';

const USERNAME = config.username;
const PASSWORD = config.password;

export function basicAuth(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.set('WWW-Authenticate', 'Basic realm="VCT-Registry"');
        return res.status(401).json({error: 'No authorization header'});
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Basic') {
        return res.status(401).json({ error: 'Unsupported auth type. Only Basic authentication is supported.' });
    }

    const authCredentials = Buffer.from(token, 'base64').toString('utf8');
    const [username, password] = authCredentials.split(':');
    if (username !== USERNAME || password !== PASSWORD) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Authorization complete
    next();
}
