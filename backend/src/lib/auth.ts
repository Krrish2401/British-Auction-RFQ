import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export type AuthTokenPayload = {
    userId: string;
    role: string;
    name: string;
};

export function signToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: "7d"
    });
}

export function verifyToken(token: string): AuthTokenPayload | null {
    try {
        const decoded = jwt.verify(token, env.jwtSecret);

        if (!decoded || typeof decoded === "string") {
            return null;
        }

        if (
            typeof decoded.userId !== "string" ||
            typeof decoded.role !== "string" ||
            typeof decoded.name !== "string"
        ) {
            return null;
        }

        return {
            userId: decoded.userId,
            role: decoded.role,
            name: decoded.name
        };
    } catch {
        return null;
    }
}
