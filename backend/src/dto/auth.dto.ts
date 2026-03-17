export type RegisterRequestDto = {
    name: string;
    email: string;
    password: string;
    role: "BUYER" | "SUPPLIER";
};

export type LoginRequestDto = {
    email: string;
    password: string;
};

export type AuthUserResponseDto = {
    id: string;
    email: string;
    name: string;
    role: "BUYER" | "SUPPLIER";
};
