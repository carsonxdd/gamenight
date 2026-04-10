import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "api:users", { max: 30, windowMs: 60_000 });
  if (limited) return limited;

  const users = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: {
      id: true,
      name: true,
      gamertag: true,
      avatar: true,
      games: { select: { gameName: true } },
    },
    orderBy: { gamertag: "asc" },
  });

  return NextResponse.json(users);
}
