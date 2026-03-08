import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "VISITOR" | "MEMBER" | "DEPT_LEAD" | "FINANCE" | "ADMIN" | "SUPER_ADMIN";
      status: "PENDING" | "ACTIVE" | "INACTIVE";
    } & DefaultSession["user"];
  }

  interface User {
    role: "VISITOR" | "MEMBER" | "DEPT_LEAD" | "FINANCE" | "ADMIN" | "SUPER_ADMIN";
    status: "PENDING" | "ACTIVE" | "INACTIVE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "VISITOR" | "MEMBER" | "DEPT_LEAD" | "FINANCE" | "ADMIN" | "SUPER_ADMIN";
    status: "PENDING" | "ACTIVE" | "INACTIVE";
  }
}
