import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET() {
  let check = "connection";
  try {
    await prisma.$queryRaw`SELECT 1`;
    check = "schema";
    // Validate the additive release migration without reading any member records.
    await prisma.$queryRaw`SELECT "directoryShowEmail", "directoryShowPhone" FROM "users" LIMIT 0`;
    return NextResponse.json({ status: "healthy" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error(JSON.stringify({ event: "database_readiness_failed", check }));
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
