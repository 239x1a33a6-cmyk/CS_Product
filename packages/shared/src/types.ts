export type Role = "STUDENT" | "MENTOR" | "ADMIN";

export type JwtPayload = {
  sub: string;   // user id
  email: string;
  name: string;
  role: Role;
};

export type AuthUser = JwtPayload;
