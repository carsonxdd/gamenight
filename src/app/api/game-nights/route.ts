import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: Record<string, unknown> = {};
  if (start || end) {
    where.date = {};
    if (start) (where.date as Record<string, Date>).gte = new Date(start);
    if (end) (where.date as Record<string, Date>).lte = new Date(end);
  }

  const gameNights = await prisma.gameNight.findMany({
    where,
    include: {
      attendees: {
        include: {
          user: { select: { name: true, gamertag: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(gameNights);
}
