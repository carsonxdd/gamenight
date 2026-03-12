import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSiteSettings } from "@/app/admin/settings-actions";

/**
 * Checks access rules and redirects if needed.
 * Call at the top of protected server page components.
 * Returns the session if access is granted, or redirects.
 */
export async function checkAccessOrRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const settings = await getSiteSettings();

  // Pending approval — redirect to signup which shows the pending message
  if (session.user.approvalStatus === "pending" || session.user.approvalStatus === "rejected") {
    redirect("/signup");
  }

  // Require gamertag — redirect to signup to complete profile
  if (settings.requireGamertag && !session.user.gamertag) {
    redirect("/signup");
  }

  return session;
}
