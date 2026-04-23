import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DevLoginList from "./DevLoginList";

export const dynamic = "force-dynamic";

export default async function DevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      gamertag: true,
      avatar: true,
      isOwner: true,
      isAdmin: true,
      isModerator: true,
      approvalStatus: true,
    },
    orderBy: [{ isOwner: "desc" }, { isAdmin: "desc" }, { isModerator: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-foreground">Dev Login</h1>
      <p className="mb-8 text-center text-sm text-foreground/50">
        Development-only user switcher. Disabled in production builds.
      </p>
      <Card className="p-4 sm:p-6">
        <DevLoginList users={users} />
      </Card>
    </div>
  );
}
