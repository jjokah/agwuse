import { type DefaultSession } from "next-auth";
import { type UserRole } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: "PENDING" | "ACTIVE" | "INACTIVE";
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
  }
}
