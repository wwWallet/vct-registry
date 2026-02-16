import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../../config";

const USERS = config.users;
const COOKIE_NAME = "vctRegistrySessionId"
const COOKIE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

const SESSIONS = new Map<string, { username: string; expires: number }>();

// Helper: generate a random session ID
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// Middleware: Basic Auth
function basicAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        return res.status(401).send('Authentication required.');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (USERS[username] && USERS[username] === password) {
        // Credentials valid
        (req as any).username = username;
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Login Required"');
        return res.status(401).send('Invalid credentials.');
    }
}

// Middleware: check cookie OR fallback to Basic Auth
export function login(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies[COOKIE_NAME];

    if (sessionId && SESSIONS.has(sessionId)) {
        const session = SESSIONS.get(sessionId)!;
        if (session.expires > Date.now()) {
            // Refresh expiry
            session.expires = Date.now() + COOKIE_MAX_AGE;
            (req as any).username = session.username;
            return next();
        } else {
            // Expired
            SESSIONS.delete(sessionId);
        }
    }

    // No valid cookie - fallback to Basic Auth
    basicAuth(req, res, () => {
        // Issue new cookie
        const newSessionId = generateSessionId();
        const expires = Date.now() + COOKIE_MAX_AGE;
        SESSIONS.set(newSessionId, { username: (req as any).username, expires });

        res.cookie(COOKIE_NAME, newSessionId, {
            httpOnly: true,
            secure: false, // set true if HTTPS
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE
        });

        return next();
    });
}

// Middleware: check cookie only
export function auth(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies[COOKIE_NAME];

    if (sessionId && SESSIONS.has(sessionId)) {
        const session = SESSIONS.get(sessionId)!;
        if (session.expires > Date.now()) {
            // Refresh expiry
            session.expires = Date.now() + COOKIE_MAX_AGE;
            (req as any).username = session.username;
            return next();
        } else {
            // Expired
            SESSIONS.delete(sessionId);
        }
    }

    // Do not provide Basic authentication
    return res.status(401).send('Invalid credentials.');
}

export function logout(req: Request, res: Response) {
    const sessionId = req.cookies[COOKIE_NAME];
    if (sessionId) SESSIONS.delete(sessionId);
    res.clearCookie(COOKIE_NAME);
}