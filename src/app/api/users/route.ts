import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: {
      id: true,
      name: true,
      gamertag: true,
      avatar: true,
      games: { select: { gameName: true } },
      availability: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    orderBy: { gamertag: "asc" },
  });

  return NextResponse.json(users);
}
