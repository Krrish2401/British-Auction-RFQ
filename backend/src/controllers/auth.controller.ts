import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import type { AuthUserResponseDto, LoginRequestDto, RegisterRequestDto } from "../dto/auth.dto.js";
import { signToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toAuthUserResponse(user: {
    id: string;
    email: string;
    name: string;
    role: "BUYER" | "SUPPLIER";
}): AuthUserResponseDto {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    };
}

function setAuthCookie(res: Response, token: string): void {
    res.cookie("auth_token", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

export async function register(req: Request, res: Response): Promise<void> {
    const { name, email, password, role } = req.body as Partial<RegisterRequestDto>;

    if (!name || !email || !password || !role) {
        res.status(400).json({ error: "name, email, password, and role are required" });
        return;
    }

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof role !== "string"
    ) {
        res.status(400).json({ error: "All fields must be valid strings" });
        return;
    }

    if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
    }

    if (role !== "BUYER" && role !== "SUPPLIER") {
        res.status(400).json({ error: "Role must be BUYER or SUPPLIER" });
        return;
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        res.status(409).json({ error: "Email already registered" });
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });

    const token = signToken({
        userId: user.id,
        role: user.role,
        name: user.name
    });

    setAuthCookie(res, token);
    res.status(201).json(toAuthUserResponse(user));
}

export async function login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as Partial<LoginRequestDto>;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        res.status(400).json({ error: "email and password are required" });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const token = signToken({
        userId: user.id,
        role: user.role,
        name: user.name
    });

    setAuthCookie(res, token);
    res.status(200).json(
        toAuthUserResponse({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        })
    );
}

export async function logout(_req: Request, res: Response): Promise<void> {
    res.cookie("auth_token", "", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0
    });

    res.status(200).json({ message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });

    if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    res.status(200).json(toAuthUserResponse(user));
}
