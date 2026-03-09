import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../../config";
import { is } from "zod/v4/locales";

const USERS = config.users;
const COOKIE_NAME = "vctRegistrySessionId"
const COOKIE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

const SESSIONS = new Map<string, { username: string; expires: number }>();

/**
 * @returns a random session ID
 */
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Middleware that performs basic authentication.
 */
function basicAuth(req: Request, res: Response, next: NextFunction) {
    const isProgrammaticLogin = req.get("X-Requested-With") === "XMLHttpRequest";
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        if (!isProgrammaticLogin) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        }
        return res.status(401).send('Authentication required.');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (USERS[username] && USERS[username] === password) {
        (req as any).username = username;
        next();
    } else {
        if (!isProgrammaticLogin) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        }
        return res.status(401).send('Invalid credentials.');
    }
}

function isValidSession(req: Request) {
    const sessionId = req.cookies[COOKIE_NAME];

    if (sessionId && SESSIONS.has(sessionId)) {
        const session = SESSIONS.get(sessionId)!;
        if (session.expires > Date.now()) {
            session.expires = Date.now() + COOKIE_MAX_AGE;
            return session.username;
        } else {
            SESSIONS.delete(sessionId);
        }
    }
    return null;
}

/**
 * Middleware that checks for a valid session cookie.
 * If not present, it falls back to basic authentication and issues a session cookie.
 */
export function login(req: Request, res: Response, next: NextFunction) {

    const username = isValidSession(req);
    if (username) {
        (req as any).username = username;
        return next();
    }

    basicAuth(req, res, () => {
        const newSessionId = generateSessionId();
        const expires = Date.now() + COOKIE_MAX_AGE;
        SESSIONS.set(newSessionId, { username: (req as any).username, expires });

        res.cookie(COOKIE_NAME, newSessionId, {
            httpOnly: true,
            secure: config.https,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE
        });

        return next();
    });
}

/**
 * Middleware that checks for a valid session cookie without falling back to basic authentication.
 */
export function auth(req: Request, res: Response, next: NextFunction) {

    const username = isValidSession(req);
    if (username) {
        (req as any).username = username;
        return next();
    }

    // Do not provide Basic authentication
    return res.status(401).send('Invalid credentials.');
}

/**
 * Middleware that checks for a valid session cookie without falling back to basic authentication.
 */
export function authView(req: Request, res: Response, next: NextFunction) {

    const username = isValidSession(req);
    if (username) {
        (req as any).username = username;
        return next();
    }

    // Do not provide Basic authentication
    return res.redirect(config.base_url);
}

/**
 * Clear auth cookie to logout.
 */
export function logout(req: Request, res: Response) {
    const sessionId = req.cookies[COOKIE_NAME];
    if (sessionId) SESSIONS.delete(sessionId);
    res.clearCookie(COOKIE_NAME);
}
